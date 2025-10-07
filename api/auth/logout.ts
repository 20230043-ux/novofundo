import { VercelRequest, VercelResponse } from '@vercel/node';
import { deleteCookie } from 'cookies-next';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  deleteCookie('accessToken', { req, res });
  deleteCookie('refreshToken', { req, res });

  return res.status(200).json({ message: 'Logout realizado com sucesso' });
}
