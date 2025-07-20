
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X, Send } from 'lucide-react';
import { toast } from 'sonner';

interface SupportFormProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  userName?: string;
}

export const SupportForm = ({ isOpen, onClose, userEmail, userName }: SupportFormProps) => {
  const [email, setEmail] = useState(userEmail || '');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !subject.trim() || !message.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create mailto link with support email
      const supportEmail = 'marcbelem55@gmail.com';
      const emailSubject = encodeURIComponent(`Support Request: ${subject}`);
      const emailBody = encodeURIComponent(
        `From: ${userName || 'User'} (${email})\n\nMessage:\n${message}\n\n---\nSent from Mind Vault Support Form`
      );
      
      const mailtoLink = `mailto:${supportEmail}?subject=${emailSubject}&body=${emailBody}`;
      
      // Open default email client
      window.location.href = mailtoLink;
      
      toast.success('Opening your email client... Your support request is ready to send!');
      
      // Reset form and close
      setEmail(userEmail || '');
      setSubject('');
      setMessage('');
      onClose();
      
    } catch (error) {
      toast.error('Failed to open email client. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-700 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Send className="h-5 w-5" />
            Contact Support
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email" className="text-slate-300">Your Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="bg-slate-700 border-slate-600 text-white"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="subject" className="text-slate-300">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief description of your issue"
              className="bg-slate-700 border-slate-600 text-white"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="message" className="text-slate-300">Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Please describe your issue or concern in detail..."
              rows={4}
              className="bg-slate-700 border-slate-600 text-white resize-none"
              required
            />
          </div>
          
          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Send className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Opening...' : 'Send Support Request'}
            </Button>
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </form>
        
        <p className="text-xs text-slate-400 text-center">
          This will open your default email client with a pre-filled message to our support team.
        </p>
      </DialogContent>
    </Dialog>
  );
};
