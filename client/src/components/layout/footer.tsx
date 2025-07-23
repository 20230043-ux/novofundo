import { Link } from "wouter";
import { Leaf, Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white pt-12 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* About */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <img src="/logo.svg" alt="Fundo Verde Logo" className="h-7 w-7" />
              <h3 className="font-bold text-lg">Fundo Verde</h3>
            </div>
            <p className="text-gray-400 mb-4">
              Plataforma para cálculo de pegada de carbono e investimento em Objetivos de Desenvolvimento Sustentável.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-lg mb-4">Links Rápidos</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-400 hover:text-white transition-colors">
                  Início
                </Link>
              </li>
              <li>
                <Link href="/ods" className="text-gray-400 hover:text-white transition-colors">
                  ODS
                </Link>
              </li>
              <li>
                <Link href="/projetos" className="text-gray-400 hover:text-white transition-colors">
                  Projetos
                </Link>
              </li>
              <li>
                <Link href="/auth" className="text-gray-400 hover:text-white transition-colors">
                  Login
                </Link>
              </li>
              <li>
                <Link href="/auth" className="text-gray-400 hover:text-white transition-colors">
                  Registro
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Contact */}
          <div>
            <h3 className="font-bold text-lg mb-4">Contato</h3>
            <ul className="space-y-2">
              <li className="flex items-center">
                <Mail className="h-4 w-4 mr-2 text-primary" />
                <a href="mailto:contato@calculadoracarbono.com" className="text-gray-400 hover:text-white transition-colors">
                  contato@calculadoracarbono.com
                </a>
              </li>
              <li className="flex items-center">
                <Phone className="h-4 w-4 mr-2 text-primary" />
                <span className="text-gray-400">+244 943412688</span>
              </li>
              <li className="flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-primary" />
                <span className="text-gray-400">Luanda, Angola</span>
              </li>
            </ul>
          </div>
          
          {/* Newsletter */}
          <div>
            <h3 className="font-bold text-lg mb-4">Newsletter</h3>
            <p className="text-gray-400 mb-4">
              Inscreva-se para receber atualizações sobre nossos projetos e iniciativas.
            </p>
            <form action="#" method="POST" className="flex">
              <Input
                type="email"
                placeholder="Seu email"
                className="rounded-r-none text-gray-800 focus-visible:ring-primary"
              />
              <Button type="submit" size="icon" className="rounded-l-none">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
        
        <div className="border-t border-gray-700 pt-6 text-center">
          <p className="text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} Calculadora de Carbono com Fundo Verde. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
