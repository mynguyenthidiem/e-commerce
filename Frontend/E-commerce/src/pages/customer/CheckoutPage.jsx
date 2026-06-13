import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Steps, Card, Form, Input, Select, Button, Divider, Tag, Radio } from 'antd';
import { useCart } from '../../context/CartContext';
import paymentMethodApi from '../../api/paymentMethodApi';
import orderApi from '../../api/orderApi';
import shippingAddressApi from '../../api/shippingAddressApi';
import voucherApi from '../../api/voucherApi';
import paymentApi from '../../api/paymentApi'
import {useProducts} from '../../context/ProductContext';


export default function CheckoutPage() {
  const { items, clearCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [discountAmount, setDiscountAmount] = useState(0);
  const [voucherValid, setVoucherValid] = useState(false);
  const {refreshProduct} = useProducts();

  // selectedItemIds từ CartPage hoặc Buy Now
  const selectedItemIds = location.state?.selectedItemIds ?? null;
  const checkoutItems = selectedItemIds
    ? items.filter(i => selectedItemIds.includes(i.id))
    : items;

  const [step, setStep] = useState(0);

  useEffect(() => { window.scrollTo(0, 0); }, [step]);
  const [paymentMethodsList, setPaymentMethodsList] = useState([]);
  const [payMethod, setPayMethod] = useState(null);
  const [coupon, setCoupon] = useState('');
  const [couponMsg, setCouponMsg] = useState('');
  const [addresses, setAddresses] = useState([]);
  const [selectedAddrId, setSelectedAddrId] = useState(null);

  const formatPrice = (p) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

  const subtotal = checkoutItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const shipping = subtotal >= 5000000 ? 0 : 30000;
  const total = subtotal - discountAmount + shipping;

  useEffect(() => {
    paymentMethodApi.getAll().then(res => {
      const active = (res.data || []).filter(p => p.isActive);
      setPaymentMethodsList(active);
      if (active.length > 0) setPayMethod(active[0].id);
    });
  }, []);

  useEffect(() => {
    shippingAddressApi.getAll().then(res => {
      const list = res.data || [];
      setAddresses(list);
      const def = list.find(a => a.isDefault) || list[0];
      if (def) setSelectedAddrId(def.id);
    });
  }, []);

  const handleOrder = async () => {
    try {
      const res =  await orderApi.create({
                      shippingAddressId: selectedAddrId,
                      paymentMethodId: payMethod,
                      voucherCode: coupon || null,
                      cartItemIds: selectedItemIds ?? null,
                    });
      const orderId = res.data.id;
      const productIds = [...new Set(checkoutItems.map(i => i.productId))];
	    await Promise.all(productIds.map(id => refreshProduct(id)));
      if (!selectedItemIds) await clearCart();
      
      const selectedPay = paymentMethodsList.find(p => p.id === payMethod);
      if (selectedPay?.name?.toLowerCase().includes('vnpay')){
        const payRes  = await paymentApi.createVNPay({orderId});
        window.location.href = payRes.data;
      }
      else{
        navigate('/orders', { state: { justOrdered: true } });
      }

      
      
    } catch (e) {
      console.error('Error creating order:', e);
    }
  };

  if (checkoutItems.length === 0) {
    navigate('/cart');
    return null;
  }

  const selectedPayMethod = paymentMethodsList.find(p => p.id === payMethod);

  const stepsItems = [
    { title: 'Thông tin giao hàng' },
    { title: 'Thanh toán' },
    { title: 'Xác nhận' },
  ];

  return (
    <div className="py-8 pb-16">
      <div className="container">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Thanh toán</h1>

        <Steps current={step} items={stepsItems} className="mb-8" />

        <div className="grid grid-cols-[1fr_340px] gap-6 md:grid-cols-1">
          {/* Form area */}
          <div>
            {step === 0 && (
              <Card title="Địa chỉ giao hàng">
                {addresses.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <p className="mb-3">Bạn chưa có địa chỉ nhận hàng nào.</p>
                    <Button type="primary" onClick={() => navigate('/account')}>
                      Thêm địa chỉ ngay
                    </Button>
                  </div>
                ) : (
                  <>
                    <Radio.Group
                      value={selectedAddrId}
                      onChange={e => setSelectedAddrId(e.target.value)}
                      className="w-full"
                    >
                      <div className="flex flex-col gap-3">
                        {addresses.map(addr => (
                          <Radio key={addr.id} value={addr.id} className="w-full">
                            <div className={`ml-2 border rounded-lg p-3 cursor-pointer transition-colors ${
                              selectedAddrId === addr.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                            }`}>
                              <p className="font-medium text-sm">
                                {addr.fullName} · {addr.phoneNumber}
                                {addr.isDefault && <Tag color="blue" className="ml-2">Mặc định</Tag>}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {addr.street}, {addr.ward}, {addr.district}, {addr.province}
                              </p>
                            </div>
                          </Radio>
                        ))}
                      </div>
                    </Radio.Group>
                    <div className="mt-4">
                      <Button onClick={() => navigate('/account', { state: { tab: 'address' } })}>
                        + Quản lý địa chỉ
                      </Button>
                    </div>
                  </>
                )}
              </Card>
            )}

            {step === 1 && (
              <Card title="Phương thức thanh toán">
                <Radio.Group value={payMethod} onChange={e => setPayMethod(e.target.value)} className="w-full">
                  <div className="flex flex-col gap-3">
                    {paymentMethodsList.map(p => (
                      <Radio key={p.id} value={p.id} className="w-full">
                        <div className={`ml-2 border rounded-lg p-3 cursor-pointer transition-colors ${payMethod === p.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                          <p className="font-medium text-sm">{p.name}</p>
                          <p className="text-xs text-gray-500">{p.description}</p>
                        </div>
                      </Radio>
                    ))}
                  </div>
                </Radio.Group>
                
              </Card>
            )}

            {step === 2 && (
              <Card title="Xác nhận đơn hàng">
                <div className="flex flex-col gap-4">
                  {(() => {
                    const addr = addresses.find(a => a.id === selectedAddrId);
                    return addr ? (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-semibold text-sm mb-2">Thông tin giao hàng</h4>
                        <p><strong>{addr.fullName}</strong> · {addr.phoneNumber}</p>
                        <p className="text-gray-600 text-sm">
                          {addr.street}, {addr.ward}, {addr.district}, {addr.province}
                        </p>
                      </div>
                    ) : null;
                  })()}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-sm mb-1">Thanh toán</h4>
                    <p className="text-sm">{selectedPayMethod?.name ?? '—'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-sm mb-2">Sản phẩm ({checkoutItems.length})</h4>
                    {checkoutItems.map(item => (
                      <div key={item.id} className="flex justify-between text-sm py-1">
                        <span className="text-gray-600">
                          {item.productName || item.productVariantName}
                          {item.productName && ` — ${item.productVariantName}`}
                          {' '}× {item.quantity}
                        </span>
                        <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                  
                </div>
              </Card>
            )}
          </div>

          {/* Order Summary */}
          <div className="self-start">
            <Card title={`Đơn hàng (${checkoutItems.length})`}>
              <div className="flex flex-col gap-3 mb-4">
                {checkoutItems.map(item => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-gray-100 flex-shrink-0 overflow-hidden">
                      {item.thumbnailUrl
                        ? <img src={item.thumbnailUrl} alt={item.productName} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-gray-400">🛍️</div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.productName || item.productVariantName}</p>
                      {item.productName && (
                        <p className="text-xs text-gray-400 truncate">{item.productVariantName}</p>
                      )}
                      <p className="text-xs text-gray-500">× {item.quantity}</p>
                    </div>
                    <span className="text-sm font-semibold">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="Mã giảm giá"
                  value={coupon}
                  onChange={e => {
                    setCoupon(e.target.value.toUpperCase());
                    setCouponMsg('');
                    setDiscountAmount(0); 
                    setVoucherValid(false); 
                  }}
                  size="small"
                />
                <Button size="small" 
                  onClick={async () => {
                  if (!coupon) { setCouponMsg('❌ Vui lòng nhập mã'); return; }
                  try {
                    const res = await voucherApi.validate({ code: coupon, orderAmount: subtotal });
                    setDiscountAmount(res.data.discountAmount);
                    setVoucherValid(true);
                    setCouponMsg(`✅ Giảm ${formatPrice(res.data.discountAmount)}`);
                  } catch {
                    setDiscountAmount(0);
                    setVoucherValid(false);
                    setCouponMsg('❌ Mã không hợp lệ hoặc không đủ điều kiện');
                  }
                }}>
                  Áp dụng
                </Button>
              </div>
              {couponMsg && (
                <p className={`text-xs mb-3 ${couponMsg.includes('❌') ? 'text-red-500' : 'text-green-600'}`}>
                  {couponMsg}
                </p>
              )}

              <Divider className="my-3" />
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-gray-600">Tạm tính</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-gray-600">Vận chuyển</span>
                <span>{shipping === 0 ? <Tag color="green">Miễn phí</Tag> : formatPrice(shipping)}</span>
                
              </div>
              {discountAmount > 0 && (
                  <div className="flex justify-between text-sm mb-1.5 text-green-600">
                    <span>Giảm giá ({coupon})</span>
                    <span>- {formatPrice(discountAmount)}</span>
                  </div>
                )}
              <Divider className="my-3" />
              <div className="flex justify-between font-bold text-lg">
                <span>Tổng cộng</span>
                <span className="text-blue-600">{formatPrice(total)}</span>
              </div>
              {/* Action bar */}
              <div className="mt-6 flex justify-between items-center border-t pt-6">
                <div>
                  {step > 0 && (
                    <Button size="large" onClick={() => setStep(step - 1)}>
                      ← Quay lại
                    </Button>
                  )}
                </div>
                <div>
                  {step === 0 && (
                    <Button type="primary" size="large"
                      disabled={!selectedAddrId}
                      onClick={() => setStep(1)}>
                      Tiếp tục →
                    </Button>
                  )}
                  {step === 1 && (
                    <Button type="primary" size="large"
                      disabled={!payMethod}
                      onClick={() => setStep(2)}>
                      Xem lại đơn →
                    </Button>
                  )}
                  {step === 2 && (
                    <Button type="primary" size="large" onClick={handleOrder}>
                      ✓ Đặt hàng
                    </Button>
                  )}
                </div>
</div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
