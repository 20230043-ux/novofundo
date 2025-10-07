import { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyToken, JWTPayload } from './jwt';
import { getCookie } from 'cookies-next';

export interface AuthenticatedRequest extends VercelRequest {
  user?: JWTPayload;
}

export function withAuth(
  handler: (req: AuthenticatedRequest, res: VercelResponse) => Promise<void | VercelResponse>
) {
  return async (req: AuthenticatedRequest, res: VercelResponse) => {
    const token = getCookie('accessToken', { req, res }) as string | undefined;
    
    if (!token) {
      return res.status(401).json({ message: 'Não autorizado' });
    }
    
    const payload = verifyToken(token);
    
    if (!payload) {
      return res.status(401).json({ message: 'Token inválido ou expirado' });
    }
    
    req.user = payload;
    return handler(req, res);
  };
}

export function withRole(
  role: 'admin' | 'company' | 'individual',
  handler: (req: AuthenticatedRequest, res: VercelResponse) => Promise<void | VercelResponse>
) {
  return withAuth(async (req: AuthenticatedRequest, res: VercelResponse) => {
    if (req.user?.role !== role) {
      return res.status(403).json({ message: 'Acesso negado' });
    }
    
    return handler(req, res);
  });
}

export const withAdmin = (handler: (req: AuthenticatedRequest, res: VercelResponse) => Promise<void | VercelResponse>) => 
  withRole('admin', handler);

export const withCompany = (handler: (req: AuthenticatedRequest, res: VercelResponse) => Promise<void | VercelResponse>) => 
  withRole('company', handler);

export const withIndividual = (handler: (req: AuthenticatedRequest, res: VercelResponse) => Promise<void | VercelResponse>) => 
  withRole('individual', handler);
