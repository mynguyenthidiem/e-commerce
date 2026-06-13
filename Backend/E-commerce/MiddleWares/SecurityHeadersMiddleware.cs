namespace E_commerce.Middlewares
{
    public class SecurityHeadersMiddleware
    {
        private readonly RequestDelegate _next;

        public SecurityHeadersMiddleware(RequestDelegate next) => _next = next;

        public async Task InvokeAsync(HttpContext context)
        {
            context.Response.Headers["X-Content-Type-Options"] = "nosniff"; // nêu k có nó, browser tự đoán loại file, có nosniff thì nó phải tin tưởng content-type của server
            context.Response.Headers["X-Frame-Options"] = "DENY"; // k cho nhúng jframe từ bất kì đâu
            context.Response.Headers["X-XSS-Protection"] = "1; mode=block"; //chặn luôn cả trang nếu phát hiện xss
            context.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin"; // kiểm soát thông tin referer gửi kèm khi user click ra ngoài

            // Swagger dùng inline scripts nên bỏ qua CSP cho route /swagger
            if (!context.Request.Path.StartsWithSegments("/swagger"))
            {
                context.Response.Headers["Content-Security-Policy"] =
                    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://res.cloudinary.com; font-src 'self'";
            }

            await _next(context);
        }
    }
}
