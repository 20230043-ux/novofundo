import { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../lib/db';
import { users, companies, individuals, InsertUser, InsertCompany, InsertIndividual } from '@shared/schema';
import { generateAccessToken, generateRefreshToken } from '../lib/jwt';
import { setCookie } from 'cookies-next';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    const { email, password, role, ...profileData } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ message: 'Email, senha e tipo de usuário são obrigatórios' });
    }

    const existingUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, email),
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Email já cadastrado' });
    }

    const hashedPassword = await hashPassword(password);

    const [newUser] = await db.insert(users).values({
      email,
      password: hashedPassword,
      role,
    }).returning();

    if (role === 'company') {
      const companyData: InsertCompany = {
        userId: newUser.id,
        name: profileData.name || '',
        sector: profileData.sector || '',
        logoUrl: profileData.logoUrl || null,
        phone: profileData.phone || null,
        location: profileData.location || null,
        employeeCount: profileData.employeeCount || null,
      };
      
      await db.insert(companies).values(companyData);
    } else if (role === 'individual') {
      const individualData: InsertIndividual = {
        userId: newUser.id,
        firstName: profileData.firstName || '',
        lastName: profileData.lastName || '',
        phone: profileData.phone || null,
        location: profileData.location || null,
        occupation: profileData.occupation || null,
        profilePictureUrl: profileData.profilePictureUrl || null,
      };
      
      await db.insert(individuals).values(individualData);
    }

    const accessToken = generateAccessToken(newUser);
    const refreshToken = generateRefreshToken(newUser);

    setCookie('accessToken', accessToken, {
      req,
      res,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
    });

    setCookie('refreshToken', refreshToken, {
      req,
      res,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
    });

    return res.status(201).json({
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ message: 'Erro ao criar conta' });
  }
}
