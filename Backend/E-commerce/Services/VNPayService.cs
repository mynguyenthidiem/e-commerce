using System.Net;
using System.Security.Cryptography;
using System.Text;
using E_commerce.Services.Interfaces;
using Microsoft.AspNetCore.Http;

namespace E_commerce.Services
{
    public class VNPayService : IVNPayService
    {
        private readonly IConfiguration _config;

        public VNPayService(IConfiguration config) => _config = config;

        public string CreatePaymentUrl(Guid orderId, decimal amount, string orderInfo, string ipAddress)
        {
            var vnNow = DateTime.UtcNow.AddHours(7); // UTC+7 Việt Nam

            var vnpay = new SortedDictionary<string, string>
            {
                { "vnp_Version",     "2.1.0" },
                { "vnp_Command",     "pay" },
                { "vnp_TmnCode",     _config["VNPay:TmnCode"]! },
                { "vnp_Amount",      ((long)(amount * 100)).ToString() }, //Tính theo đơn vị nhỏ nhất 
                { "vnp_CreateDate",  vnNow.ToString("yyyyMMddHHmmss") },
                { "vnp_CurrCode",    "VND" },
                { "vnp_IpAddr",      ipAddress },
                { "vnp_Locale",      "vn" },
                { "vnp_OrderInfo",   orderInfo },
                { "vnp_OrderType",   "other" },
                { "vnp_ReturnUrl",   _config["VNPay:ReturnUrl"]! }, // chỗ redirect user sau khi đã thanh toán xong
                { "vnp_TxnRef",      orderId.ToString() }, // Mã tham chiếu giao dịch, dùng để map lại khi IPN về
                { "vnp_ExpireDate",  vnNow.AddMinutes(15).ToString("yyyyMMddHHmmss") }, // Thời gian link hết hạn thanh toán
            };

            // encode từng thành phần, nối thành chuỗi
            var queryString = string.Join("&",
                vnpay.Select(kv => $"{kv.Key}={WebUtility.UrlEncode(kv.Value)}"));

            var secureHash = HmacSha512(_config["VNPay:HashSecret"]!, queryString);

            return $"{_config["VNPay:BaseUrl"]}?{queryString}&vnp_SecureHash={secureHash}";
        }

        public bool ValidateCallback(IQueryCollection query, out string transactionStatus)
        {
            transactionStatus = query["vnp_TransactionStatus"].ToString();

            var receivedHash = query["vnp_SecureHash"].ToString(); // lấy hash VNPay được gửi kèm về

            // Lấy tất cả params TRỪ vnp_SecureHash, sort và nối lại
            var filtered = query
                .Where(k => k.Key != "vnp_SecureHash" && k.Key != "vnp_SecureHashType")
                .OrderBy(k => k.Key);

            var queryString = string.Join("&",
                // ✓ Đúng — dùng raw value
                filtered.Select(kv => $"{kv.Key}={kv.Value}"));

            var expectedHash = HmacSha512(_config["VNPay:HashSecret"]!, queryString);

            return string.Equals(expectedHash, receivedHash, StringComparison.OrdinalIgnoreCase);
        }

        private static string HmacSha512(string key, string data)
        {
            var keyBytes = Encoding.UTF8.GetBytes(key);
            var dataBytes = Encoding.UTF8.GetBytes(data);
            using var hmac = new HMACSHA512(keyBytes);
            return Convert.ToHexString(hmac.ComputeHash(dataBytes)).ToLower();
        }
    }
}
