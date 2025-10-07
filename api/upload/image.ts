import { VercelRequest, VercelResponse } from '@vercel/node';
import { withAuth, AuthenticatedRequest } from '../lib/auth-middleware';
import { uploadToCloudinary } from '../lib/cloudinary';

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    const { image, folder = 'general', publicId } = req.body;

    if (!image) {
      return res.status(400).json({ message: 'Imagem é obrigatória' });
    }

    const result = await uploadToCloudinary(image, folder, publicId);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Upload image error:', error);
    return res.status(500).json({ message: 'Erro ao fazer upload da imagem' });
  }
}

export default withAuth(handler);
