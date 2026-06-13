using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace E_commerce.Models
{
    public class Order
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required(ErrorMessage = "Order Date is required.")]
        public DateTime OrderDate { get; set; } = DateTime.UtcNow;

        [Column(TypeName = "decimal(18,2)")]
        public decimal SubTotal { get; set; }

        [Column(TypeName="decimal(18,2)")]
        public decimal DiscountAmount { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalAmount { get; set; }

        [Required(ErrorMessage ="Order status is required.")]
        public OrderStatus Status { get; set; } = OrderStatus.Pending;

        [Required(ErrorMessage ="UserId is required.") ]
        public Guid UserId { get; set; }

        [ForeignKey("UserId")]
        public User? User { get; set; }

        [Required, StringLength(100)]
        public string ReceiverName { get; set; } = null!;

        [Required, StringLength(15)]
        public string ReceiverPhone { get; set; } = null!;

        // Snapshot: "Street, Ward, District, Province"
        [Required(ErrorMessage ="Shipping Address is required.")]
        [StringLength(500)]
        public string ShippingAddress { get; set; } = null!;

        [Required(ErrorMessage ="PaymentMethodId is required.")]
        public Guid PaymentMethodId { get; set; }

        [ForeignKey("PaymentMethodId")]
        public PaymentMethod? PaymentMethod { get; set; }

        public virtual ICollection<OrderDetail> OrderDetails { get; set; } = new List<OrderDetail>();

        // 1 order có thể có 1 hoặc không support request => không icollection
        public virtual SupportRequest? SupportRequest { get; set; }

        public Guid? VoucherId { get; set; }
        // trong trường hợp order không dùng voucher => voucher có thể null =>> Guid?: chấp nhận giá trị null

        [ForeignKey("VoucherId")]
        public Voucher? Voucher { get; set; }
        public DateTime? PaymentExpiredAt { get; set; }

    }

    public enum OrderStatus
    {
        Pending,
        Processing,
        Shipped,
        Delivered,
        Cancelled
    }
}
