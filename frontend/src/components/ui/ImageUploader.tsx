import { useState } from 'react'
import { uploadApi } from '../../api'

interface ImageUploaderProps {
  currentUrl?: string
  target: 'booth' | 'product'
  onUploaded: (objectKey: string) => void
}

export function ImageUploader({ currentUrl, target, onUploaded }: ImageUploaderProps) {
  const [preview, setPreview] = useState(currentUrl)
  const [status, setStatus] = useState<'idle' | 'uploading' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const upload = async (file?: File) => {
    if (!file) return
    setPreview(URL.createObjectURL(file))
    setStatus('uploading')
    setErrorMessage('')
    try {
      onUploaded(await uploadApi.image(file, target))
      setStatus('idle')
    } catch (error) {
      const message = error instanceof Error ? error.message.trim() : ''
      setErrorMessage(message || '업로드하지 못했습니다.')
      setStatus('error')
    }
  }

  return <label className="field full image-uploader">
    <span>대표 이미지</span>
    <div className="image-uploader-row">
      {preview && <img src={preview} alt="선택한 대표 이미지 미리보기" />}
      <input className="input" type="file" accept="image/jpeg,image/png,image/webp" disabled={status === 'uploading'} onChange={(event) => void upload(event.target.files?.[0])} />
    </div>
    <small>{status === 'uploading' ? '이미지를 업로드하고 있습니다…' : status === 'error' ? `${errorMessage} 다시 선택해 주세요.` : 'JPG, PNG, WebP 이미지를 선택할 수 있습니다.'}</small>
  </label>
}
