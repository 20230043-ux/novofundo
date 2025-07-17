import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useSmartImage } from "@/hooks/use-smart-image";



interface ProjectCardProps {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  totalInvested: string;

  sdg?: {
    id: number;
    number: number;
    name: string;
    color: string;
  };
}

const ProjectCard = ({ id, name, description, imageUrl, totalInvested, sdg }: ProjectCardProps) => {
  // Use smart image loading hook
  const { 
    imageUrl: smartImageUrl, 
    isLoading: imageLoading, 
    hasError: imageError, 
    fallbackStyle, 
    fallbackContent 
  } = useSmartImage(imageUrl, name);


  // Format currency - showing only actual values
  const formatCurrency = (value: string | number | undefined | null) => {
    // No value provided or zero value
    if (value === undefined || value === null) {
      return "0 Kz";
    }
    
    // Convert to a number for proper formatting
    const num = typeof value === 'string' ? parseFloat(value) : value;
    
    // If the value is invalid or zero, show zero
    if (isNaN(num)) {
      return "0 Kz";
    }
    
    // Use locale formatting - display actual value always
    return new Intl.NumberFormat('pt-AO', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num) + " Kz";
  };
  
  // Convert hex color to rgb
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };
  
  // Get text color based on background color
  const getBadgeTextColor = (bgColor: string) => {
    const rgb = hexToRgb(bgColor);
    if (!rgb) return "text-white";
    
    // Calculate luminance
    const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
    return luminance > 0.5 ? "text-gray-800" : "text-white";
  };
  
  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 group bg-white">
      <div className="h-48 overflow-hidden bg-gray-100 relative">
        {imageLoading && (
          <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse flex items-center justify-center">
            <div className="text-gray-500 animate-bounce">Carregando...</div>
          </div>
        )}
        
        {smartImageUrl && !imageError && (
          <img 
            src={smartImageUrl} 
            alt={name} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
        )}
        
        {imageError && (
          <div style={fallbackStyle} className="transition-transform duration-500 group-hover:scale-105">
            {fallbackContent}
          </div>
        )}
        
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300"></div>
      </div>
      
      <CardContent className="p-6 relative">
        <div className="flex flex-wrap items-center mb-4">
          {sdg && (
            <>
              <Badge 
                style={{ backgroundColor: sdg.color || '#22c55e' }}
                className={`mr-2 transform group-hover:scale-105 transition-all duration-300 ${getBadgeTextColor(sdg.color || '#22c55e')}`}
              >
                ODS {sdg.number || 'N/A'}
              </Badge>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors duration-300">{sdg.name || 'ODS'}</span>
              </div>
            </>
          )}
        </div>
        
        <h3 className="font-semibold text-xl mb-2 line-clamp-1 group-hover:text-primary transition-colors duration-300">
          {name}
        </h3>
        
        <p className="text-gray-600 mb-4 line-clamp-2 group-hover:text-gray-700 transition-colors duration-300">
          {description}
        </p>
        
        <div className="flex justify-between items-center">
          <div className="transition-all duration-300 group-hover:transform group-hover:scale-105">
            <p className="text-sm text-gray-500 group-hover:text-gray-600 transition-colors duration-300">
              Valor investido
            </p>
            <p className="font-bold text-primary group-hover:text-primary-600 transition-colors duration-300">
              {formatCurrency(totalInvested)}
            </p>
          </div>
          
          <Link 
            href={`/projeto/${id}`} 
            className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md border border-primary text-primary hover:bg-primary hover:text-white transition-all duration-300 transform hover:scale-105 hover:shadow-lg group-hover:border-primary-600"
          >
            Ver Detalhes
            <ArrowRight className="ml-1 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectCard;
