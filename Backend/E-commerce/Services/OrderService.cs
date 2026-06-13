using E_commerce.Data;
using E_commerce.DTOs.Notification;
using E_commerce.DTOs.Order;
using E_commerce.Models;
using E_commerce.Repositories;
using E_commerce.Repositories.Interfaces;
using E_commerce.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using E_commerce.DTOs.Notification;

namespace E_commerce.Services
{
    public class OrderService : IOrderService
    {
        private readonly IOrderRepository _orderRepo;
        private readonly IProductVariantRepository _variantRepo;
        private readonly IVoucherRepository _voucherRepo;
        private readonly ICartService _cartService;
        private readonly AppDbContext _context;
        private readonly INotificationService _notificationService;

        public OrderService(
            IOrderRepository orderRepository,
            IProductVariantRepository variantRepository,
            IVoucherRepository voucherRepository,
            ICartService cartService,
            AppDbContext context,
            INotificationService notificationService)
        {
            _orderRepo = orderRepository;
            _variantRepo = variantRepository;
            _voucherRepo = voucherRepository;
            _cartService = cartService;
            _context = context;
            _notificationService = notificationService;
        }

        public async Task<List<OrderResponse>> GetAllOrders()
        {
            var result = await _orderRepo.GetAll();
            return result
                .OrderByDescending(o => o.OrderDate)
                .Select(o => MapToResponse(o))
                .ToList();
        }
        public async Task<List<OrderResponse>> GetMyOrders(Guid userId, OrderFilterRequest? filter = null)
            
        {
            var result = await _orderRepo.GetByUserId(userId);
            if (filter?.Status.HasValue == true)
            {
                result = result.Where(o => (int) o.Status == filter.Status.Value).ToList();
            }
            return result
                .OrderByDescending(o => o.OrderDate)
                .Select(o => MapToResponse(o))
                .ToList();

        }
        public async Task<OrderResponse> GetOrderById(Guid id)
        {
            var result = await _orderRepo.GetById(id);
            if (result == null) throw new KeyNotFoundException("Order doesn't exits.");
            return MapToResponse(result);
        }
        public async Task<OrderResponse> CreateOrder(Guid userId, CreateOrderRequest request)
        {
            // Lấy địa chỉ giao hàng và snapshot vào order
            var addr = await _context.ShippingAddresses
                .FirstOrDefaultAsync(sa => sa.Id == request.ShippingAddressId && sa.UserId == userId)
                ?? throw new KeyNotFoundException("Shipping address not found.");

            var cart = await _cartService.GetCartAsync(userId);
            if (cart == null || !cart.Items.Any())
                throw new InvalidOperationException("Cart is empty.");

            var orderItems = (request.CartItemIds != null && request.CartItemIds.Count > 0)
                ? cart.Items.Where(i => request.CartItemIds.Contains(i.Id)).ToList()
                : cart.Items.ToList();

            if (!orderItems.Any())
                throw new InvalidOperationException("No valid items selected.");

            Voucher? voucher = null;
            if (!string.IsNullOrWhiteSpace(request.VoucherCode))
            {
                voucher = await _voucherRepo.GetByCode(request.VoucherCode);
                if (voucher == null) throw new KeyNotFoundException("Voucher not found.");

                var now = DateTime.UtcNow;
                if (!voucher.IsActive || now < voucher.StartDate || now > voucher.EndDate)
                    throw new InvalidOperationException("Voucher is expired or inactive.");
                if (voucher.UsedCount >= voucher.TotalQuantity)
                    throw new InvalidOperationException("Voucher has been fully used.");
            }
            Order? order = null;
            await using var transaction = await _context.Database
                .BeginTransactionAsync(System.Data.IsolationLevel.RepeatableRead);
            try
            {

                    decimal subTotal = 0;
                    var itemSnapshots = new List<(ProductVariant variant, int quantity, decimal price)>();

                    foreach (var item in orderItems)
                    {
                        var variant = await _variantRepo.GetById(item.ProductVariantId);
                        if (variant == null) throw new KeyNotFoundException($"Variant {item.ProductVariantId} not found.");

                        if (variant.Quantity < item.Quantity) // này là order lớn hơn trữ lượng đang có
                            throw new InvalidOperationException(
                                $"Insufficient products for order. '{variant.Name}' only has {variant.Quantity} in stock.");

                        subTotal += variant.Price * item.Quantity;
                        itemSnapshots.Add((variant, item.Quantity, variant.Price));

                    }

                    if (voucher != null && subTotal < voucher.MinOrderAmount)
                        throw new InvalidOperationException(
                            $"Order total must be at least {voucher.MinOrderAmount:C} to use this voucher.");

                    decimal discount = 0;
                    if (voucher != null)
                    {
                        discount = voucher.DiscountType == DiscountType.Percentage
                            ? Math.Min(subTotal * voucher.DiscountValue / 100m, voucher.MaxDiscountAmount)
                            : Math.Min(voucher.DiscountValue, subTotal);

                        voucher.UsedCount++;
                    }
                    var details = new List<OrderDetail>();
                    foreach (var (variant, quantity, price) in itemSnapshots)
                    {
                        variant.Quantity -= quantity;
                        details.Add(new OrderDetail
                        {
                            ProductVariantId = variant.Id,
                            OrderQuantity = quantity,
                            UnitPrice = price
                        });
                    }

                    order = new Order
                    {
                        UserId          = userId,
                        ReceiverName    = addr.FullName,
                        ReceiverPhone   = addr.PhoneNumber,
                        ShippingAddress = $"{addr.Street}, {addr.Ward}, {addr.District}, {addr.Province}",
                        PaymentMethodId = request.PaymentMethodId,
                        VoucherId = voucher?.Id,
                        SubTotal = subTotal,
                        DiscountAmount = discount,
                        TotalAmount = subTotal - discount,
                        OrderDetails = details
                    };

                    await _orderRepo.AddOrder(order);
                    await _orderRepo.SaveChanges();
                    await transaction.CommitAsync();
                }
                catch
                {
                    await transaction.RollbackAsync();
                    throw;
                }

            await _notificationService.CreateAsync(new CreateNotificationRequest
            {
                UserId = userId,
                Title = "Đặt hàng thành công",
                Message = $"Đơn hàng của bạn đã được xác nhận. Mã đơn: {order!.Id}",
                Type = "ORDER_CONFIRMED"
            });


            if (request.CartItemIds != null && request.CartItemIds.Count > 0)
                await _cartService.RemoveItemsByIdsAsync(request.CartItemIds);
            else
                await _cartService.ClearCartAsync(userId);
            var saved = await _orderRepo.GetById(order.Id)
                ?? throw new Exception("Failed to reload saved order.");
            return MapToResponse(saved);
        }
        public async Task<OrderResponse> UpdateStatus(Guid id, UpdateOrderStatusRequest request)
        {
            var order = await _orderRepo.GetById(id);
            if (order == null) throw new KeyNotFoundException("Order not found.");

            order.Status = request.OrderStatus;
            await _orderRepo.SaveChanges();
            
            string? title = null;
            string? message = null;
            switch (request.OrderStatus)
            {
                case OrderStatus.Processing:
                    title = "Đơn hàng đang được xử lí";
                    message = $"Đơn hàng {order.Id} của bạn đang được chuẩn bị";
                    break;
                case OrderStatus.Shipped:
                    title = "Đơn hàng đang được giao";
                    message = $"Đơn hàng {order.Id} của bạn đang được giao";
                    break;
                case OrderStatus.Delivered:
                    title = "Đơn hàng đã giao thành công";
                    message = $"Đơn hàng {order.Id} của bạn đã được giao thành công. Cảm ơn bạn!";
                    break;
            }
            if (title != null)
{
    await _notificationService.CreateAsync(new CreateNotificationRequest
    {
        UserId  = order.UserId,
        Title   = title,
        Message = message!,
        Type    = "ORDER_STATUS_UPDATED"
    });
}

            return MapToResponse(order);
        }
        
        public async Task CancelOrder(Guid orderId, Guid userId)
        {
            var order = await _orderRepo.GetById(orderId)
                ?? throw new KeyNotFoundException("Order not found.");

            if (order.UserId != userId)
                throw new UnauthorizedAccessException("You can only cancel your own order.");

            if (order.Status != OrderStatus.Pending)
                throw new InvalidOperationException("Only pending orders can be cancelled.");

            // Hoàn trả stock
            foreach (var detail in order.OrderDetails)
            {
                var variant = await _variantRepo.GetById(detail.ProductVariantId);
                if (variant != null) variant.Quantity += detail.OrderQuantity;
            }

            // Hoàn trả lượt dùng voucher
            if (order.VoucherId != null)
            {
                var voucher = await _voucherRepo.GetById(order.VoucherId.Value);
                if (voucher != null && voucher.UsedCount > 0) voucher.UsedCount--;
            }

            order.Status = OrderStatus.Cancelled;
            await _orderRepo.SaveChanges();

            await _notificationService.CreateAsync(new CreateNotificationRequest
            {
                UserId = userId,
                Title = "Đơn hàng đã được hủy",
                Message = $"Đơn hàng {orderId} của bạn đã được hủy thành công.",
                Type = "ORDER_CANCELLED"
            });
        }

        public async Task SetPaymentExpiry(Guid orderId, DateTime expiredAt)
        {
            var order = await _orderRepo.GetById(orderId)
                ?? throw new KeyNotFoundException("Order not found.");
            order.PaymentExpiredAt = expiredAt;
            await _orderRepo.SaveChanges();
        }

        private static OrderResponse MapToResponse(Order order) => new OrderResponse()
        {
            Id = order.Id,
            OrderDate = order.OrderDate,
            Status = order.Status,
            ReceiverName = order.ReceiverName,
            ReceiverPhone = order.ReceiverPhone,
            ShippingAddress = order.ShippingAddress,
            SubTotal = order.SubTotal,
            DiscountAmount = order.DiscountAmount,
            TotalAmount = order.TotalAmount,
            PaymentMethodName = order.PaymentMethod != null? order.PaymentMethod.Name : string.Empty,
            VoucherCode = order.Voucher?.Code,
            UserId = order.UserId,
            
            Items = order.OrderDetails.Select(od => new OrderDetailResponse
            {
                Id = od.Id,
                ProductVariantId = od.ProductVariantId,
                ProductName = od.ProductVariant?.Product?.Name ?? string.Empty,
                VariantName = od.ProductVariant != null? od.ProductVariant.Name : string.Empty,
                OrderQuantity = od.OrderQuantity,
                UnitPrice = od.UnitPrice,
                TotalPrice = od.UnitPrice * od.OrderQuantity,
                ImageUrl = od.ProductVariant?.Product?.ProductImages
               ?.FirstOrDefault()?.ImageUrl ?? string.Empty,
            }).ToList()
        };
    }
}

