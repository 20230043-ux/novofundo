import { VercelRequest, VercelResponse } from '@vercel/node';
import { withAuth, AuthenticatedRequest } from '../lib/auth-middleware';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    const { folder = 'general', publicId } = req.body;

    const timestamp = Math.round(new Date().getTime() / 1000);
    const uploadPreset = 'fundo-verde';

    const params: any = {
      timestamp,
      folder: `fundo-verde/${folder}`,
      upload_preset: uploadPreset,
    };

    if (publicId) {
      params.public_id = publicId;
    }

    const signature = cloudinary.utils.api_sign_request(
      params,
      process.env.CLOUDINARY_API_SECRET || ''
    );

    return res.status(200).json({
      signature,
      timestamp,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      folder: params.folder,
      uploadPreset,
    });
  } catch (error) {
    console.error('Sign upload error:', error);
    return res.status(500).json({ message: 'Erro ao gerar assinatura de upload' });
  }
}

export default withAuth(handler);
