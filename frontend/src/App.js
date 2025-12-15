import React, { useState, useEffect } from 'react';
import '@/App.css';
import axios from 'axios';
import CalendarView from '@/components/CalendarView';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import EventModal from '@/components/EventModal';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const API = `${BACKEND_URL}/api`;

function App() {
  const [events, setEvents] = useState([]);
  const [deployments, setDeployments] = useState([]);
  const [namespaceInfo, setNamespaceInfo] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch initial data
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    console.info('Fetching all initial data...');
    try {
      setLoading(true);
      await Promise.all([
        fetchEvents(),
        fetchDeployments(),
        fetchNamespaceInfo()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      console.info('Fetching events...');
      const response = await axios.get(`${API}/events`);
      console.info(`Fetched ${response.data.length} events`);
      setEvents(response.data);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const fetchDeployments = async () => {
    try {
      console.info('Fetching deployments...');
      const response = await axios.get(`${API}/deployments`);
      console.info(`Fetched ${response.data.length} deployments`);
      setDeployments(response.data);
    } catch (error) {
      console.error('Error fetching deployments:', error);
    }
  };

  const fetchNamespaceInfo = async () => {
    try {
      console.info('Fetching namespace info...');
      const response = await axios.get(`${API}/namespace-info`);
      console.info('Namespace info fetched:', response.data);
      setNamespaceInfo(response.data);
    } catch (error) {
      console.error('Error fetching namespace info:', error);
    }
  };

  const handleDateClick = (info) => {
    setSelectedDate(info.date);
    setSelectedEvent(null);
    setIsModalOpen(true);
  };

  const handleEventClick = (info) => {
    const event = events.find(e => e.id === info.event.id);
    setSelectedEvent(event);
    setSelectedDate(null);
    setIsModalOpen(true);
  };

  const handleCreateEvent = async (eventData) => {
    try {
      console.info('Creating new event:', eventData);
      await axios.post(`${API}/events`, eventData);
      toast.success('Event created successfully');
      await fetchAllData();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error('Failed to create event');
    }
  };

  const handleUpdateEvent = async (eventId, eventData) => {
    try {
      console.info(`Updating event ${eventId}:`, eventData);
      await axios.put(`${API}/events/${eventId}`, eventData);
      toast.success('Event updated successfully');
      await fetchAllData();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error updating event:', error);
      toast.error('Failed to update event');
    }
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      console.info(`Deleting event ${eventId}`);
      await axios.delete(`${API}/events/${eventId}`);
      toast.success('Event deleted successfully');
      await fetchAllData();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
    }
  };

  const handleRefresh = () => {
    fetchAllData();
    toast.success('Data refreshed');
  };

  return (
    <div className="app-container">
      <Toaster position="top-right" richColors />
      <Header
        namespaceInfo={namespaceInfo}
        onRefresh={handleRefresh}
      />
      <div className="main-content">
        <Sidebar
          deployments={deployments}
          namespaceInfo={namespaceInfo}
        />
        <div className="calendar-container">
          {loading ? (
            <div className="loading-container" data-testid="loading-spinner">
              <div className="spinner"></div>
              <p>Loading KEDA resources...</p>
            </div>
          ) : (
            <CalendarView
              events={events}
              onDateClick={handleDateClick}
              onEventClick={handleEventClick}
            />
          )}
        </div>
      </div>

      {isModalOpen && (
        <EventModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          event={selectedEvent}
          selectedDate={selectedDate}
          deployments={deployments}
          onCreate={handleCreateEvent}
          onUpdate={handleUpdateEvent}
          onDelete={handleDeleteEvent}
        />
      )}
    </div>
  );
}

export default App;
