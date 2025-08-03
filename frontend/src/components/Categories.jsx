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
  { description: "Fotografie", image: camera, color: "#FF6B6B" },
  { description: "Prajituri", image: prajituri, color: "#4ECDC4" },
  { description: "Muzica", image: muzica, color: "#45B7D1" },
  { description: "Reparații", image: reparatii, color: "#96CEB4" },
  { description: "Dans", image: dancing, color: "#FFEAA7" },
  { description: "Curățenie", image: curatenie, color: "#DDA0DD" },
  { description: "Gradinarit", image: gardening, color: "#98D8C8" },
  { description: "Sport", image: tennis, color: "#F7DC6F" },
  { description: "Arta", image: arta, color: "#BB8FCE" },
  { description: "Tehnologie", image: it, color: "#85C1E9" },
  { description: "Auto", image: masina, color: "#F8C471" },
  { description: "Meditații", image: carte, color: "#82E0AA" },
];

// Restore the default export of the Categories component
export default function Categories() {
  const navigate = useNavigate();

  return (
    <div className="categories-container">
      <Container maxWidth="lg">
        <h2 className="categories-title">Explorează categorii</h2>
        
        {/* Categories Grid */}
        <Grid container spacing={3} justifyContent="center">
          {categories.map((category, index) => (
            <Grid item xs={6} sm={4} md={3} lg={2} key={index}>
              <Card
                onClick={() => navigate(`/anunturi-categorie/${encodeURIComponent(category.description)}`)}
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  position: 'relative',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                  },
                  background: `linear-gradient(135deg, ${category.color}20, ${category.color}10)`,
                  border: `2px solid ${category.color}40`,
                }}
              >
                <Box sx={{ 
                  height: 120, 
                  backgroundColor: 'white', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  p: 2
                }}>
                  <img
                    src={category.image}
                    alt={category.description}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain',
                      display: 'block'
                    }}
                  />
                </Box>
                <CardContent sx={{ p: 2, textAlign: 'center' }}>
                  <Typography 
                    variant="h6" 
                    component="h3"
                    sx={{ 
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: { xs: '0.9rem', sm: '1rem' },
                      mb: 1
                    }}
                  >
                    {category.description}
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