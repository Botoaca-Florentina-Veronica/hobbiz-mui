import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, CardContent, Avatar, IconButton, Typography, Divider, Box } from '@mui/material';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import apiClient, { getProfile } from '../api/api';
import './PublicProfile.css';

export default function PublicProfileAllReviews() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function fetch() {
      try {
        setLoading(true);
        const res = await apiClient.get(`/api/users/profile/${userId}`);
        if (!mounted) return;
        setProfile(res.data);
      } catch (e) {
        console.error('Failed to load profile for all reviews', e);
        setProfile(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    if (userId) fetch();
    return () => { mounted = false; };
  }, [userId]);

  if (loading) return <Container className="public-profile-container"><div>Se încarcă...</div></Container>;
  if (!profile) return <Container className="public-profile-container"><div>Profil indisponibil</div></Container>;

  return (
    <Container maxWidth={false} className="public-profile-container">
      <Box style={{ margin: '20px 0' }}>
        <IconButton onClick={() => navigate(-1)} aria-label="back">Înapoi</IconButton>
      </Box>

      <GridLikeWrapper>
        {/* Reuse the same summary card area */}
        <div className="public-profile-reviews-wrap">
          <Card className="public-profile-reviews-card">
            <CardContent className="public-profile-reviews-content">
              <Typography variant="h6" className="public-profile-reviews-title">Toate recenziile pentru {profile.firstName} {profile.lastName}</Typography>
            </CardContent>
          </Card>
        </div>

        {/* All reviews list below */}
        <div style={{ marginTop: 16 }} className="public-profile-reviews-list-container">
          <div className="public-profile-reviews-list-inner">
            {Array.isArray(profile.reviews) && profile.reviews.length > 0 ? (
              profile.reviews.map(r => (
                <div key={r._id} className="compact-review-item">
                  <div className="compact-review-left">
                    <Avatar src={r.authorAvatar} sx={{ width:44, height:44 }}>{(r.authorName||'U').charAt(0)}</Avatar>
                  </div>
                  <div className="compact-review-main">
                    <div className="compact-review-top">
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div className="compact-review-author">{r.authorName || 'Utilizator'}</div>
                        <div className="compact-review-date">{r.createdAt ? new Date(r.createdAt).toLocaleDateString('ro-RO') : ''}</div>
                        { (r.announcementTitle || (r.announcement && (r.announcement.title || r.announcement.name))) && (
                          <div className="compact-review-ann-title">{r.announcementTitle || (r.announcement && (r.announcement.title || r.announcement.name))}</div>
                        ) }
                      </div>
                      <div />
                    </div>
                    <div className="compact-review-body">{r.comment}</div>
                    <div className="compact-review-actions">
                      <div className="compact-review-score">{Number(r.score || 0).toFixed(1)}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 12 }}>
                        <ThumbUpIcon fontSize="small" />
                        <div style={{ fontWeight: 700 }}>{(r.likes || []).length || 0}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="public-profile-no-reviews">Acest utilizator nu are recenzii încă.</div>
            )}
          </div>
        </div>
      </GridLikeWrapper>
    </Container>
  );
}

// Minimal layout helper (avoids importing Grid) to keep card and list stacked on narrow layout
function GridLikeWrapper({ children }) {
  return <div style={{ display: 'flex', gap: 24, flexDirection: 'column' }}>{children}</div>;
}
