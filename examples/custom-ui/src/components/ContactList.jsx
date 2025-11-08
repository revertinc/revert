import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ContactList.css';

const ContactList = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });

  const api = axios.create({
    baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000',
  });

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/contacts?pageSize=20');
      setContacts(response.data.results || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateContact = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/contacts', formData);
      setFormData({ firstName: '', lastName: '', email: '' });
      fetchContacts();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="container">
      <h1>Revert - Contacts</h1>

      {error && <div className="error">{error}</div>}

      <div className="form-section">
        <h2>Create Contact</h2>
        <form onSubmit={handleCreateContact}>
          <input
            type="text"
            name="firstName"
            placeholder="First Name"
            value={formData.firstName}
            onChange={handleInputChange}
            required
          />
          <input
            type="text"
            name="lastName"
            placeholder="Last Name"
            value={formData.lastName}
            onChange={handleInputChange}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleInputChange}
            required
          />
          <button type="submit">Create Contact</button>
        </form>
      </div>

      <div className="list-section">
        <h2>Contacts</h2>
        <button onClick={fetchContacts} disabled={loading}>
          {loading ? 'Loading...' : 'Refresh'}
        </button>

        {loading && <p>Loading contacts...</p>}

        {contacts.length > 0 ? (
          <table className="contacts-table">
            <thead>
              <tr>
                <th>First Name</th>
                <th>Last Name</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact, index) => (
                <tr key={index}>
                  <td>{contact.firstName || '-'}</td>
                  <td>{contact.lastName || '-'}</td>
                  <td>{contact.email || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          !loading && <p>No contacts found.</p>
        )}
      </div>
    </div>
  );
};

export default ContactList;
