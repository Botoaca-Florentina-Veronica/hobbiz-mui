import React, { useState, useRef, useEffect } from 'react';
import './AddAnnouncementPage.css';
import Popover from '@mui/material/Popover';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import { FaMapMarkerAlt, FaCamera } from 'react-icons/fa';
import { categories } from '../components/Categories.jsx';
import '../components/Categories.css';
import { useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../api/api';

// ...poți copia aici constantă judete și getCategoryHint din AddAnnouncementPage.jsx...

const judete = {/* ...poți copia lista de județe de acolo... */};
const getCategoryHint = (category) => {/* ...poți copia funcția de acolo... */};

export default function EditAnnouncementPage() {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [titleChars, setTitleChars] = useState(0);
  const [description, setDescription] = useState("");
  const [descriptionChars, setDescriptionChars] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedJudet, setSelectedJudet] = useState(null);
  const [selectedLocalitate, setSelectedLocalitate] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const imageInputRef = useRef(null);
  const [images, setImages] = useState([]);
  const [mainImagePreview, setMainImagePreview] = useState(null);
  const [categoryAnchorEl, setCategoryAnchorEl] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const [announcementId, setAnnouncementId] = useState(null);

  useEffect(() => {
    let a = null;
    if (location.state && location.state.announcement) {
      a = location.state.announcement;
    } else {
      const savedEdit = localStorage.getItem('editAnnouncement');
      if (savedEdit) {
        a = JSON.parse(savedEdit);
      }
    }
    if (a) {
      setTitle(a.title || '');
      setCategory(a.category || '');
      setTitleChars(a.title ? a.title.length : 0);
      setDescription(a.description || '');
      setDescriptionChars(a.description ? a.description.length : 0);
      setSelectedJudet(null);
      setSelectedLocalitate(a.location || '');
      setContactPerson(a.contactPerson || '');
      setContactEmail(a.contactEmail || '');
      setContactPhone(a.contactPhone || '');
      setMainImagePreview(a.images && a.images[0] ? a.images[0] : null);
      setAnnouncementId(a._id);
    }
  }, [location.state]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(prev => [...prev, ...files]);
    if (files[0]) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMainImagePreview(reader.result);
      };
      reader.readAsDataURL(files[0]);
    }
  };

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
    setTitleChars(e.target.value.length);
  };

  const handleSubmit = async () => {
    setError("");
    setSuccess("");
    const token = localStorage.getItem('token');
    if (!token) {
      setError("Trebuie să fii autentificat pentru a actualiza anunțul!");
      return;
    }
    if (!title || title.length < 16 || !category || !description || description.length < 40 || !(selectedJudet || selectedLocalitate) || !contactPerson) {
      setError("Te rugăm să completezi toate câmpurile obligatorii și să respecți limitele de caractere!");
      return;
    }
    if (contactPhone && !/^\d{10}$/.test(contactPhone)) {
      setError("Numărul de telefon trebuie să conțină exact 10 cifre!");
      return;
    }
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('category', category);
      formData.append('description', description);
      formData.append('location', selectedLocalitate);
      formData.append('contactPerson', contactPerson);
      formData.append('contactEmail', contactEmail);
      formData.append('contactPhone', contactPhone);
      if (images[0]) {
        formData.append('mainImage', images[0]);
      }
      await apiClient.put(`/api/users/my-announcements/${announcementId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });
      setSuccess('Anunț actualizat cu succes!');
      setTimeout(() => navigate('/anunturile-mele'), 1200);
    } catch (e) {
      setError('Eroare la actualizarea anunțului. Încearcă din nou!');
    }
  };

  // ...restul codului pentru UI, copiat și adaptat din AddAnnouncementPage.jsx...
  // Înlocuiește butonul cu "Actualizează anunțul" și nu include logica de publicare nouă
}
