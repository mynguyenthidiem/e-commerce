using E_commerce.DTOs.Order;

namespace E_commerce.Services.Interfaces
{
    public interface IOrderService
    {
        Task<List<OrderResponse>> GetAllOrders();
        Task<List<OrderResponse>> GetMyOrders(Guid userId, OrderFilterRequest? filter = null);
        Task<OrderResponse> GetOrderById(Guid id);
        Task<OrderResponse> CreateOrder(Guid userId, CreateOrderRequest request);
        Task<OrderResponse> UpdateStatus(Guid id, UpdateOrderStatusRequest request);
        Task CancelOrder(Guid orderId, Guid userId);
        Task SetPaymentExpiry(Guid orderId, DateTime expiredAt);
    }
}
