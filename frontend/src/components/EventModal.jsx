import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Trash2 } from 'lucide-react';
import './EventModal.css';

const triggerTypes = [
  { value: 'cron', label: 'Cron Schedule' },
  { value: 'message_queue', label: 'Message Queue' },
  { value: 'kafka', label: 'Kafka' },
  { value: 'http', label: 'HTTP' },
  { value: 'prometheus', label: 'Prometheus' },
  { value: 'custom', label: 'Custom' }
];

const EventModal = ({ 
  isOpen, 
  onClose, 
  event, 
  selectedDate, 
  deployments,
  onCreate, 
  onUpdate, 
  onDelete 
}) => {
  const [formData, setFormData] = useState({
    title: '',
    start: '',
    end: '',
    all_day: false,
    trigger_type: 'cron',
    target_deployment: '',
    desired_replicas: 1,
    cron_expression: '0 0 * * *',
    metadata: {}
  });

  useEffect(() => {
    if (event) {
      // Edit mode
      setFormData({
        title: event.title,
        start: formatDateForInput(event.start),
        end: event.end ? formatDateForInput(event.end) : '',
        all_day: event.all_day,
        trigger_type: event.trigger_type,
        target_deployment: event.target_deployment,
        desired_replicas: event.desired_replicas,
        cron_expression: event.cron_expression || '0 0 * * *',
        metadata: event.metadata || {}
      });
    } else if (selectedDate) {
      // Create mode with selected date
      const dateStr = selectedDate.toISOString().split('T')[0];
      setFormData(prev => ({
        ...prev,
        start: `${dateStr}T09:00`,
        end: `${dateStr}T17:00`
      }));
    }
  }, [event, selectedDate]);

  const formatDateForInput = (dateStr) => {
    const date = new Date(dateStr);
    return date.toISOString().slice(0, 16);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const eventData = {
      ...formData,
      start: new Date(formData.start).toISOString(),
      end: formData.end ? new Date(formData.end).toISOString() : null
    };

    if (event) {
      onUpdate(event.id, eventData);
    } else {
      onCreate(eventData);
    }
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      onDelete(event.id);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="event-modal" data-testid="event-modal">
        <DialogHeader>
          <DialogTitle data-testid="modal-title">
            {event ? 'Edit Scaling Event' : 'Create Scaling Event'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="event-form">
          <div className="form-group">
            <Label htmlFor="title">Event Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Scale up for peak hours"
              required
              data-testid="event-title-input"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <Label htmlFor="start">Start Date/Time *</Label>
              <Input
                id="start"
                type="datetime-local"
                value={formData.start}
                onChange={(e) => setFormData({ ...formData, start: e.target.value })}
                required
                data-testid="event-start-input"
              />
            </div>
            <div className="form-group">
              <Label htmlFor="end">End Date/Time</Label>
              <Input
                id="end"
                type="datetime-local"
                value={formData.end}
                onChange={(e) => setFormData({ ...formData, end: e.target.value })}
                data-testid="event-end-input"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <Label htmlFor="trigger_type">Trigger Type *</Label>
              <Select
                value={formData.trigger_type}
                onValueChange={(value) => setFormData({ ...formData, trigger_type: value })}
              >
                <SelectTrigger id="trigger_type" data-testid="trigger-type-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {triggerTypes.map(type => (
                    <SelectItem key={type.value} value={type.value} data-testid={`trigger-option-${type.value}`}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="form-group">
              <Label htmlFor="desired_replicas">Desired Replicas *</Label>
              <Input
                id="desired_replicas"
                type="number"
                min="0"
                max="100"
                value={formData.desired_replicas}
                onChange={(e) => setFormData({ ...formData, desired_replicas: parseInt(e.target.value) })}
                required
                data-testid="desired-replicas-input"
              />
            </div>
          </div>

          <div className="form-group">
            <Label htmlFor="target_deployment">Target Deployment *</Label>
            <Input
              id="target_deployment"
              value={formData.target_deployment}
              onChange={(e) => setFormData({ ...formData, target_deployment: e.target.value })}
              placeholder="e.g., web-api"
              required
              data-testid="target-deployment-input"
            />
          </div>

          {formData.trigger_type === 'cron' && (
            <div className="form-group">
              <Label htmlFor="cron_expression">Cron Expression</Label>
              <Input
                id="cron_expression"
                value={formData.cron_expression}
                onChange={(e) => setFormData({ ...formData, cron_expression: e.target.value })}
                placeholder="0 0 * * *"
                data-testid="cron-expression-input"
              />
              <p className="form-hint">Format: minute hour day month weekday</p>
            </div>
          )}

          <DialogFooter className="modal-footer">
            {event && (
              <Button 
                type="button" 
                variant="destructive" 
                onClick={handleDelete}
                className="delete-btn"
                data-testid="delete-event-button"
              >
                <Trash2 size={16} />
                Delete
              </Button>
            )}
            <div className="footer-actions">
              <Button type="button" variant="outline" onClick={onClose} data-testid="cancel-button">
                Cancel
              </Button>
              <Button type="submit" data-testid="submit-event-button">
                {event ? 'Update' : 'Create'} Event
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EventModal;
