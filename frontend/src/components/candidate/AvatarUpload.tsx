import { useState } from 'react';
import { Avatar, Spin, Tooltip, message } from 'antd';
import { CameraOutlined, UserOutlined } from '@ant-design/icons';
import ImgCrop from 'antd-img-crop';
import { Upload } from 'antd';
import type { RcFile } from 'antd/es/upload';
import { useUploadPhoto } from '../../hooks/useCandidate';
import { mediaUrl } from '../../services/api';
import { COLORS } from '../../theme';

// ── Validation (runs on original file, before crop dialog) ───────────────────

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_SIZE_MB   = 2;

function validatePhoto(file: RcFile): true | string {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'Format non supporté. Utilisez JPG, PNG, GIF ou WebP.';
  }
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return `Image trop lourde (max ${MAX_SIZE_MB} Mo).`;
  }
  return true;
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  photoUrl?: string | null;
  size?: number;
}

export default function AvatarUpload({ photoUrl, size = 88 }: Props) {
  const { mutateAsync: uploadPhoto, isPending } = useUploadPhoto();
  const [preview, setPreview] = useState<string | null>(null);

  const resolvedUrl = preview ?? mediaUrl(photoUrl) ?? undefined;

  return (
    <ImgCrop
      rotationSlider
      cropShape="round"
      quality={0.88}
      modalTitle="Recadrer la photo"
      modalOk="Valider"
      modalCancel="Annuler"
    >
      <Upload
        accept={ALLOWED_TYPES.join(',')}
        showUploadList={false}
        beforeUpload={(file) => {
          // Validate BEFORE the crop dialog opens
          const result = validatePhoto(file);
          if (result !== true) {
            message.error(result);
            return Upload.LIST_IGNORE;
          }
          return true;
        }}
        customRequest={async ({ file }) => {
          // `file` here is the cropped Blob from antd-img-crop
          const blob = file as Blob;
          // Canvas.toBlob() can return type="" for some browsers — fall back to jpeg
          const mimeType = blob.type || 'image/jpeg';
          const ext      = mimeType.split('/')[1] ?? 'jpg';
          const f        = new File([blob], `photo.${ext}`, { type: mimeType });

          // Optimistic preview
          const reader = new FileReader();
          reader.onload = (e) => setPreview(e.target?.result as string);
          reader.readAsDataURL(f);

          try {
            await uploadPhoto(f);
          } catch {
            setPreview(null);
          }
        }}
      >
        <Tooltip title="Changer la photo de profil" placement="bottom">
          <div style={{ position: 'relative', display: 'inline-block', cursor: 'pointer' }}>
            <Spin spinning={isPending} size="small">
              <Avatar
                size={size}
                src={resolvedUrl}
                icon={!resolvedUrl ? <UserOutlined /> : undefined}
                style={{
                  background: `${COLORS.primary}1A`,
                  color: COLORS.primary,
                  border: `3px solid ${COLORS.gold}`,
                  display: 'block',
                }}
              />
            </Spin>

            {/* Camera badge */}
            <div
              style={{
                position: 'absolute',
                bottom: 3,
                right: 3,
                width: 26,
                height: 26,
                background: COLORS.gold,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                pointerEvents: 'none',
              }}
            >
              <CameraOutlined style={{ fontSize: 13, color: '#fff' }} />
            </div>
          </div>
        </Tooltip>
      </Upload>
    </ImgCrop>
  );
}
