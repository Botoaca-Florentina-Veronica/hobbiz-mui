import React from 'react';
import { 
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Container
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import reparatii from '../assets/images/pipe.png';
import muzica from '../assets/images/guitar.png';
import dancing from '../assets/images/salsa.png';
import gardening from '../assets/images/gardening-logo.jpg';
import tennis from '../assets/images/tennis.png';
import it from '../assets/images/laptop.png';
import camera from '../assets/images/camera.png';
import prajituri from '../assets/images/bake.png';
import carte from '../assets/images/carte.png';
import arta from '../assets/images/arta.png';
import masina from '../assets/images/car.png';
import curatenie from '../assets/images/cleaning.png';
import './Categories.css';
import { useNavigate } from 'react-router-dom';

// Export the categories array
export const categories = [
  { key: 'photography', description: "Fotografie", image: camera, color: "#FF6B6B" },
  { key: 'pastries', description: "Prajituri", image: prajituri, color: "#4ECDC4" },
  { key: 'music', description: "Muzica", image: muzica, color: "#45B7D1" },
  { key: 'repairs', description: "Reparații", image: reparatii, color: "#96CEB4" },
  { key: 'dance', description: "Dans", image: dancing, color: "#FFEAA7" },
  { key: 'cleaning', description: "Curățenie", image: curatenie, color: "#DDA0DD" },
  { key: 'gardening', description: "Gradinarit", image: gardening, color: "#98D8C8" },
  { key: 'sports', description: "Sport", image: tennis, color: "#F7DC6F" },
  { key: 'art', description: "Arta", image: arta, color: "#BB8FCE" },
  { key: 'technology', description: "Tehnologie", image: it, color: "#85C1E9" },
  { key: 'auto', description: "Auto", image: masina, color: "#F8C471" },
  { key: 'tutoring', description: "Meditații", image: carte, color: "#82E0AA" },
];

// Restore the default export of the Categories component
export default function Categories() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="categories-container">
      <Container maxWidth="lg">
        <h2 className="choose-us-title">{t('categories.title')}</h2>
        <Typography
          variant="subtitle1"
          className="choose-us-subtitle"
          sx={{ textAlign: 'center', display: 'block', marginLeft: 'auto', marginRight: 'auto', width: '100%' }}
        >
          {t('categories.subtitle')}
        </Typography>
        
        {/* Categories Grid - compact on mobile */}
        <Grid 
          container 
          spacing={{ xs: 1.5, sm: 2, md: 3 }} 
          justifyContent="center"
        >
          {categories.map((category, index) => (
            <Grid item xs={4} sm={4} md={3} lg={2} key={index}>
              <Card
                className="category-card-modern"
                onClick={() => navigate(`/anunturi-categorie/${encodeURIComponent(category.description)}`)}
                sx={{ cursor: 'pointer' }}
              >
                <Box className="category-image-box" sx={{ 
                  height: { xs: 72, sm: 96, md: 120 },
                  p: { xs: 1, sm: 1.5, md: 2 }
                }}>
                  <img
                    src={category.image}
                    alt={t(`categories.${category.key}`)}
                    loading="lazy"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain',
                      display: 'block'
                    }}
                  />
                </Box>
                <CardContent className="category-text-area" sx={{ p: { xs: 1, sm: 1.5, md: 2 }, textAlign: 'center' }}>
                  <Typography 
                    variant="subtitle2" 
                    component="h3"
                    className="category-name"
                    sx={{ 
                      fontSize: { xs: '0.8rem', sm: '0.95rem' },
                      lineHeight: 1.2,
                      mb: 0
                    }}
                  >
                    {t(`categories.${category.key}`)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

      </Container>
    </div>
  );
}