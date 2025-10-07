import { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyToken, generateAccessToken } from '../lib/jwt';
import { getCookie, setCookie } from 'cookies-next';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    const refreshToken = getCookie('refreshToken', { req, res }) as string | undefined;

    if (!refreshToken) {
      return res.status(401).json({ message: 'Token de refresh não encontrado' });
    }

    const payload = verifyToken(refreshToken);

    if (!payload) {
      return res.status(401).json({ message: 'Token de refresh inválido' });
    }

    const newAccessToken = generateAccessToken({
      id: payload.userId,
      email: payload.email,
      role: payload.role,
    });

    setCookie('accessToken', newAccessToken, {
      req,
      res,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Refresh token error:', error);
    return res.status(500).json({ message: 'Erro ao renovar token' });
  }
}
