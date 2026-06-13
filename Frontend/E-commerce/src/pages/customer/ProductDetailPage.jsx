import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Rate, Tag, InputNumber, Card, Form, Input } from 'antd';
import { ShoppingCartOutlined, ThunderboltOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useProducts } from '../../context/ProductContext';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import reviewApi from '../../api/reviewApi.js';
import { useToast, ToastContainer } from '../../hooks/useToast';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart} = useCart();
  const { user } = useAuth();
  const { toasts, show: showToast } = useToast();
  const { getProductById, refreshProduct } = useProducts();
  const [reviews, setReviews] = useState([]);
  const product = getProductById(id);
  const [selectedVariant, setSelectedVariant] = useState(null);

  useEffect(() => {
    if (id) refreshProduct(id);
  }, [id]);

  useEffect(() => {
    if (product?.variants?.length > 0 && !selectedVariant) {
      setSelectedVariant(product.variants[0]);
    }
  }, [product]);
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [added, setAdded] = useState(false);
  const [reviewForm] = Form.useForm();
  const [submittingReview, setSubmittingReview] = useState(false);
  const [canReview, setCanReview] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchReviews = async () => {
      try {
        const res = await reviewApi.getByProduct(id);
        setReviews(res.data || []);
      }catch{
        setReviews([]);
      }
    }
    fetchReviews();
  }, [id]);

  useEffect(() => {
    if (!id || !user?.roleNames?.includes('Customer')) { setCanReview(false); return; }
    reviewApi.canReview(id)
      .then(res => setCanReview(res.data?.canReview ?? false))
      .catch(() => setCanReview(false));
  }, [id, user]);

  if (!product) {
    return (
      <div className="container py-20 text-center">
        <div className="text-6xl mb-4">😕</div>
        <p className="text-xl text-gray-600 mb-6">Không tìm thấy sản phẩm</p>
        <Button type="primary" onClick={() => navigate('/products')}>Quay lại</Button>
      </div>
    );
  }
  const allImages = (product.imageUrls || []);

  const handleAddToCart = async () => {
    if (!user) { showToast('Vui lòng đăng nhập để thêm vào giỏ hàng', 'warning'); return; }
    if (!selectedVariant) return;
    try {
      await addToCart(selectedVariant.id, qty);
      setAdded(true);
      showToast(`Đã thêm "${product.name}" vào giỏ hàng`, 'success');
      setTimeout(() => setAdded(false), 2000);
    }catch {
      showToast('Thêm vào giỏ hàng thất bại', 'error');
    }
  };

  const handleBuyNow = async () => {
    if (!user) { showToast('Vui lòng đăng nhập để mua hàng', 'warning'); return; }
    if (!selectedVariant) return;
    try {
      const updatedItems = await addToCart(selectedVariant.id, qty);
      // tìm cart item vừa thêm/cập nhật theo productVariantId
      const cartItem = updatedItems.find(i => i.productVariantId === selectedVariant.id);
      navigate('/checkout', {
        state: { selectedItemIds: cartItem ? [cartItem.id] : null }
      });
    } catch {
      showToast('Có lỗi xảy ra', 'error');
    }
  };

  const handleSubmitReview = async (values) => {
  if (!user) { showToast('Vui lòng đăng nhập', 'warning'); return; }
    setSubmittingReview(true);
    try {
      await reviewApi.create(id, { rating: values.rating, comment: values.comment });
      reviewForm.resetFields();
      setCanReview(false);
      showToast('Đánh giá đã được gửi', 'success');
      const res = await reviewApi.getByProduct(id);
      setReviews(res.data || []);
    } catch {
      showToast('Bạn cần mua sản phẩm này trước khi đánh giá', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  const formatPrice = (p) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p)

  return (
    <>
      <div className="py-6 pb-16">
        <div className="container">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-6">
            <span onClick={() => navigate('/')} className="cursor-pointer hover:text-blue-600">Trang chủ</span>
            <span>›</span>
            <span onClick={() => navigate(`/products?category=${product.categoryName}`)} className="cursor-pointer hover:text-blue-600">{product.categoryName}</span>
            <span>›</span>
            <span className="text-gray-800 font-medium truncate max-w-xs">{product.name}</span>
          </nav>

          <div className="grid grid-cols-2 gap-10 md:grid-cols-1">
            {/* Images */}
            <div>
              <div className="aspect-square max-h-96 rounded-xl overflow-hidden bg-gray-100 mb-3">
                <img src={allImages[activeImg]} alt={product.name} className="w-full h-full object-contain" />
              </div>
              <div className="flex gap-2 flex-wrap">
                {allImages.map((img, i) => (
                  <div
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 cursor-pointer transition-colors ${activeImg === i ? 'border-blue-600' : 'border-gray-200 hover:border-gray-400'}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>

            {/* Info */}
            <div>
              <p className="text-sm text-blue-600 font-medium mb-1">{product.brandName}</p>
              <h1 className="text-2xl font-bold text-gray-800 mb-3">{product.name}</h1>

              <div className="flex items-center gap-3 mb-4">
                <Rate disabled value={product.averageRating} allowHalf />
                <span className="font-semibold">{product.averageRating}</span>
                <span className="text-gray-400 text-sm">({reviews.length} đánh giá)</span>
                <Tag color={selectedVariant?.quantity > 0 ? 'green' : 'red'}>
                  {selectedVariant ? `Còn ${selectedVariant.quantity} sản phẩm` : `Còn ${product.quantity} sp`}
                </Tag>
              </div>

              <div className="text-3xl font-bold text-blue-600 mb-4">
                {formatPrice(selectedVariant?.price || product.minPrice)}
              </div>

              <p className="text-gray-600 text-sm leading-relaxed mb-5">{product.description}</p>

              {product.variants.length > 0 && (
                <div className="mb-5">
                  <p className="text-sm font-medium text-gray-700 mb-2">Phiên bản: <strong>{selectedVariant?.name}</strong></p>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.map(v => (
                      <button
                        key={v.id}
                        onClick={() => setSelectedVariant(v)}
                        className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                          selectedVariant?.id === v.id
                            ? 'border-blue-600 bg-blue-50 text-blue-600'
                            : 'border-gray-300 text-gray-700 hover:border-blue-400'
                        }`}
                      >
                        {v.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 mb-5">
                <span className="text-sm font-medium text-gray-700">Số lượng:</span>
                <InputNumber min={1} value={qty} onChange={v => setQty(v || 1)} className="w-24" />
              </div>

              <div className="flex gap-3 mb-6">
                <Button
                  type="primary"
                  size="large"
                  icon={added ? <CheckCircleOutlined /> : <ShoppingCartOutlined />}
                  onClick={handleAddToCart}
                  className="flex-1"
                  style={added ? { background: '#10b981', borderColor: '#10b981' } : {}}
                >
                  {added ? 'Đã thêm vào giỏ' : 'Thêm vào giỏ hàng'}
                </Button>
                <Button size="large" icon={<ThunderboltOutlined />} onClick={handleBuyNow} className="flex-1">
                  Mua ngay
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[['✅','Chính hãng 100%'],['🔄','Đổi trả 30 ngày'],['🛡️','Bảo hành 12 tháng'],['🚚','Miễn phí giao hàng']].map(([icon, text]) => (
                  <div key={text} className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-2.5">
                    <span>{icon}</span><span>{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/*Reviews */}

            <Card title={`Đánh giá từ khách hàng (${reviews.length})`}>
              {/* Form gửi review — chỉ hiện với Customer đã đăng nhập */}
              {canReview && (
                <Form form={reviewForm} onFinish={handleSubmitReview} className="mb-6 pb-6 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-700 mb-3">Viết đánh giá của bạn</p>
                  <Form.Item name="rating" rules={[{ required: true, message: 'Vui lòng chọn số sao' }]}>
                    <Rate />
                  </Form.Item>
                  <Form.Item name="comment" rules={[{ max: 500, message: 'Tối đa 500 ký tự' }]}>
                    <Input.TextArea rows={3} placeholder="Nhận xét của bạn (không bắt buộc)..." />
                  </Form.Item>
                  <Button type="primary" htmlType="submit" loading={submittingReview}>
                    Gửi đánh giá
                  </Button>
                </Form>
              )}
              {reviews.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <div className="text-4xl mb-2">💬</div>
                  <p>Chưa có đánh giá nào</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {reviews.map(r => (
                    <div key={r.id} className="border-b border-gray-100 pb-4 last:border-0">
                      <div className="flex items-start gap-3 mb-2">
                        <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                          {r.userName?.[0]}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{r.userName}</span>
                            <span className="text-xs text-gray-400 ml-auto">
                              <span>{new Date(r.createdDate).toLocaleDateString('vi-VN')}</span>
                            </span>
                          </div>
                          <Rate disabled value={r.rating} className="text-xs" />
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 ml-12">{r.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      <ToastContainer toasts={toasts} />
    </>
  );
}
