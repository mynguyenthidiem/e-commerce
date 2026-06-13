using E_commerce.Data;
using E_commerce.Models;
using Microsoft.EntityFrameworkCore;

namespace E_commerce.BackgroundServices
{
    public class OrderExpiryService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<OrderExpiryService> _logger;

        public OrderExpiryService(IServiceScopeFactory scopeFactory, ILogger<OrderExpiryService> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                await ExpireOverdueOrders();
                await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
            }
        }

        private async Task ExpireOverdueOrders()
        {
            using var scope = _scopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var expired = await context.Orders
                .Include(o => o.OrderDetails)
                .Where(o => o.Status == OrderStatus.Pending
                         && o.PaymentExpiredAt != null
                         && o.PaymentExpiredAt < DateTime.UtcNow)
                .ToListAsync();

            foreach (var order in expired)
            {
                foreach (var detail in order.OrderDetails)
                {
                    var variant = await context.ProductVariants.FindAsync(detail.ProductVariantId);
                    if (variant != null) variant.Quantity += detail.OrderQuantity;
                }

                if (order.VoucherId != null)
                {
                    var voucher = await context.Vouchers.FindAsync(order.VoucherId);
                    if (voucher != null && voucher.UsedCount > 0) voucher.UsedCount--;
                }

                order.Status = OrderStatus.Cancelled;
                _logger.LogInformation("Order {OrderId} expired and cancelled.", order.Id);
            }

            await context.SaveChangesAsync();
        }
    }
}
