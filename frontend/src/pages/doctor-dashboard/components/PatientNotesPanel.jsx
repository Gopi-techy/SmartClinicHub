import React, { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';


const PatientNotesPanel = ({ selectedPatient, notes, onAddNote, onUpdateNote }) => {
  const { user } = useAuth();
  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState('general');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [expandedNote, setExpandedNote] = useState(null);

  const noteTypes = [
    { value: 'general', label: 'General', icon: 'FileText', color: 'text-primary' },
    { value: 'diagnosis', label: 'Diagnosis', icon: 'Stethoscope', color: 'text-success' },
    { value: 'treatment', label: 'Treatment', icon: 'Pill', color: 'text-warning' },
    { value: 'follow-up', label: 'Follow-up', icon: 'RotateCcw', color: 'text-accent' },
    { value: 'urgent', label: 'Urgent', icon: 'AlertTriangle', color: 'text-error' }
  ];

  const handleAddNote = () => {
    if (newNote.trim() && selectedPatient) {
      const note = {
        id: Date.now(),
        patientId: selectedPatient.id,
        type: noteType,
        content: newNote.trim(),
        timestamp: new Date().toISOString(),
        author: user ? (user.role === 'doctor' ? `Dr. ${user.lastName}` : `${user.firstName} ${user.lastName}`) : 'Provider'
      };
      onAddNote(note);
      setNewNote('');
      setIsAddingNote(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getNoteTypeConfig = (type) => {
    return noteTypes.find(nt => nt.value === type) || noteTypes[0];
  };

  const patientNotes = notes.filter(note => 
    selectedPatient ? note.patientId === selectedPatient.id : false
  );

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground flex items-center">
          <Icon name="StickyNote" size={24} className="mr-2 text-primary" />
          Patient Notes
        </h2>
        {selectedPatient && (
          <Button
            variant="outline"
            size="sm"
            iconName="Plus"
            onClick={() => setIsAddingNote(!isAddingNote)}
          >
            Add Note
          </Button>
        )}
      </div>

      {!selectedPatient ? (
        <div className="text-center py-8">
          <Icon name="UserX" size={48} className="mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Select a patient to view notes</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Selected Patient Info */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Icon name="User" size={20} className="text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">{selectedPatient.name}</h3>
                <p className="text-sm text-muted-foreground">ID: {selectedPatient.patientId}</p>
              </div>
            </div>
          </div>

          {/* Add Note Form */}
          {isAddingNote && (
            <div className="bg-muted/30 rounded-lg p-4 space-y-4">
              <div className="flex flex-wrap gap-2">
                {noteTypes.map((type) => (
                  <Button
                    key={type.value}
                    variant={noteType === type.value ? 'default' : 'outline'}
                    size="sm"
                    iconName={type.icon}
                    onClick={() => setNoteType(type.value)}
                    className="text-xs"
                  >
                    {type.label}
                  </Button>
                ))}
              </div>
              
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Enter your note here..."
                className="w-full p-3 border border-border rounded-lg bg-background text-foreground resize-none focus:ring-2 focus:ring-primary focus:border-transparent"
                rows={4}
              />
              
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsAddingNote(false);
                    setNewNote('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleAddNote}
                  disabled={!newNote.trim()}
                >
                  Save Note
                </Button>
              </div>
            </div>
          )}

          {/* Notes List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {patientNotes.length === 0 ? (
              <div className="text-center py-6">
                <Icon name="FileText" size={32} className="mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground text-sm">No notes available for this patient</p>
              </div>
            ) : (
              patientNotes.map((note) => {
                const typeConfig = getNoteTypeConfig(note.type);
                const isExpanded = expandedNote === note.id;
                
                return (
                  <div
                    key={note.id}
                    className="border border-border rounded-lg p-4 hover:shadow-healthcare transition-healthcare"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Icon 
                          name={typeConfig.icon} 
                          size={16} 
                          className={typeConfig.color}
                        />
                        <span className="text-sm font-medium text-foreground capitalize">
                          {typeConfig.label}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-muted-foreground">
                          {formatTimestamp(note.timestamp)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          iconName={isExpanded ? "ChevronUp" : "ChevronDown"}
                          onClick={() => setExpandedNote(isExpanded ? null : note.id)}
                        />
                      </div>
                    </div>
                    
                    <div className={`text-sm text-foreground ${
                      isExpanded ? '' : 'line-clamp-2'
                    }`}>
                      {note.content}
                    </div>
                    
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Author: {note.author}</span>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              iconName="Edit"
                              onClick={() => onUpdateNote(note)}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              iconName="Trash2"
                              className="text-destructive hover:text-destructive"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Actions */}
          {selectedPatient && (
            <div className="pt-4 border-t border-border">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  iconName="FileText"
                  onClick={() => {}}
                >
                  View History
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  iconName="Pill"
                  onClick={() => {}}
                >
                  Prescriptions
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  iconName="Calendar"
                  onClick={() => {}}
                >
                  Schedule Follow-up
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PatientNotesPanel;