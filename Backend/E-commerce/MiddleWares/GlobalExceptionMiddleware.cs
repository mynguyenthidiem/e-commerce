using System.Net;
using System.Text.Json;
using E_commerce.Helpers;

namespace E_commerce.Middlewares
{
    public class GlobalExceptionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<GlobalExceptionMiddleware> _logger;
        private readonly IWebHostEnvironment _env;

        public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger, IWebHostEnvironment env)
        {
            _next = next;
            _logger = logger;
            _env = env;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
    {
        await _next(context);

        // Xử lý sau khi pipeline chạy xong
        if (!context.Response.HasStarted)
        {
            if (context.Response.StatusCode == 401)
            {
                context.Response.ContentType = "application/json";
                var response = BaseResponse<object>.Fail("Unauthorized. Please login first.", 401);
                var json = JsonSerializer.Serialize(response, new JsonSerializerOptions
                {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                });
                await context.Response.WriteAsync(json);
            }
            else if (context.Response.StatusCode == 403)
            {
                context.Response.ContentType = "application/json";
                var response = BaseResponse<object>.Fail("You do not have permission to access this resource.", 403);
                var json = JsonSerializer.Serialize(response, new JsonSerializerOptions
                {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                });
                await context.Response.WriteAsync(json);
            }
        }
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Unhandled exception");
        await HandleExceptionAsync(context, ex);
    }
        }

        private async Task HandleExceptionAsync(HttpContext context, Exception ex)
        {
            context.Response.ContentType = "application/json";
            context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
            var message = _env.IsDevelopment() ? ex.Message : "An unexpected error occurred.";
            var response = BaseResponse<object>.Fail(message, 500);

            var json = JsonSerializer.Serialize(response, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

            await context.Response.WriteAsync(json);
        }
    }
}
