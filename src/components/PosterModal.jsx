function PosterModal({ imageUrl, fileName, alt, hint, posterKind, onClose }) {
  if (!imageUrl) return null;

  const modalTitle = posterKind === "compat" ? "相处指南海报预览" : "专属结果海报预览";
  const downloadLabel = posterKind === "compat" ? "保存相处海报" : "保存结果海报";

  async function handleDownload() {
    try {
      // Blob URL 需要先 fetch 为 blob 才能触发浏览器下载
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = fileName || "天选-知交卷-海报.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      // 释放临时 URL
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
    } catch {
      // 降级：直接用原 URL
      const link = document.createElement("a");
      link.href = imageUrl;
      link.download = fileName || "天选-知交卷-海报.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  function handleOverlayClick(e) {
    // 只有点击遮罩层本身才关闭，点击内容区不关闭
    if (e.target === e.currentTarget) {
      onClose();
    }
  }

  return (
    <div className="poster-modal-overlay" onClick={handleOverlayClick}>
      <div className="poster-modal-content">
        <button
          className="poster-modal-close"
          onClick={onClose}
          type="button"
          aria-label="关闭"
        >
          ✕
        </button>

        <p className="poster-modal-title">{modalTitle}</p>

        <div className="poster-modal-image-wrap">
          <img
            className="poster-modal-image"
            src={imageUrl}
            alt={alt || "天选海报"}
          />
        </div>

        <p className="poster-modal-hint">{hint || "长按图片可保存到手机相册"}</p>

        <button
          className="primary-button poster-modal-download"
          type="button"
          onClick={handleDownload}
        >
          {downloadLabel}
        </button>
      </div>
    </div>
  );
}

export default PosterModal;
