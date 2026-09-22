# Làm lại giao diện Arbiter (21/09/2026)

Quá trình nâng cấp giao diện từ thẻ thông thường sang hệ lưới mới (Dark/Light material), tách Dashboard, và cải thiện A11y. Dưới đây là các bẫy giao diện đã gặp phải và cách phòng chống thông qua UI Guards.

## 1. Mất dấu tiếng Việt với font hiển thị
- **Hiện tượng**: Chữ tiếng Việt bị giật cục hoặc trở về phông mặc định của hệ thống ở các ký tự có dấu, làm hỏng hoàn toàn độ đồng nhất của cụm văn bản.
- **Tên lỗi**: Missing Subset / Font Fallback Mismatch
- **Cách sửa**: Tách biệt rõ ràng nhãn cấu trúc (tiếng Anh) và nội dung đọc (tiếng Việt). Font hiển thị (Orbitron) chỉ dùng cho nhãn tiếng Anh. Các thành phần chứa tiếng Việt phải dùng font Inter (var(--font-sans)).
- **Nguyên tắc**: Không cho phép nội dung động hoặc chuỗi i18n lọt vào thẻ có class font hiển thị.
- **Bảo vệ tự động**: `orbitron-no-vietnamese.test.ts` quét mã nguồn để báo lỗi nếu phát hiện ký tự có dấu tiếng Việt trên cùng dòng/khối có chứa biến `--font-display`.

## 2. Đường cụt trên Mobile
- **Hiện tượng**: Thu nhỏ màn hình xuống 375px (Mobile), thanh điều hướng (Nav) giấu mất các liên kết do thuộc tính `.navlinks { display: none; }` để tiết kiệm diện tích. Người dùng không có cách nào bấm chuyển giữa "Market" và "Dashboard".
- **Tên lỗi**: Hidden Primary Navigation
- **Cách sửa**: Ở màn hình nhỏ, thay vì ẩn đi, các thẻ liên kết được rớt dòng xuống dưới cùng của Nav (`flex-wrap`, chiếm 100% chiều ngang).
- **Nguyên tắc**: Đường dẫn chính (Primary Paths) không được biến mất sau Hamburger Menu nếu không thực sự cần thiết, và tuyệt đối không bao giờ được `display: none` mà không có đường thay thế.

## 3. Tương phản mù màu (Accessibility)
- **Hiện tượng**: Chữ chú thích nhỏ dùng màu xám `--subtle: #8a8a8a` trên nền trắng/sáng nhìn rất thanh lịch trên màn hình Retina, nhưng thực tế đo đạc chỉ đạt độ tương phản 3.2:1 (dưới chuẩn AA 4.5:1).
- **Tên lỗi**: Low Contrast Ratio
- **Cách sửa**: Giảm độ sáng của `--subtle` thành một mã xám tối hơn để đảm bảo Contrast Ratio > 4.5.
- **Nguyên tắc**: Không dùng mắt thường để đánh giá độ tương phản.
- **Bảo vệ tự động**: `contrast.test.ts` đo toán học khoảng cách sáng-tối giữa chữ và nền để chặn mọi mã màu vi phạm chuẩn AA.
