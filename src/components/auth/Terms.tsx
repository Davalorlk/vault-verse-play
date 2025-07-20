
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

export const Terms = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="link" className="p-0 h-auto text-blue-400 hover:text-blue-300 underline">
          terms and conditions
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-800 border-slate-700 max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-white">Terms and Conditions</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="text-slate-300 space-y-4">
            <p className="text-sm italic">Last updated: June 14, 2025</p>
            
            <p>
              Welcome to <strong>MIND VAULT</strong>. These Terms and Conditions ("Terms") govern your use of this project and any associated services (collectively, the "Service"). Please read these Terms carefully before using the Service.
            </p>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">1. Acceptance of Terms</h3>
                <p>
                  By accessing or using the Service, you agree to be bound by these Terms and all applicable laws and regulations. If you do not agree with any part of these Terms, you must not use the Service.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">2. Use of the Service</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>The Service is provided "as is" and for informational and entertainment purposes only.</li>
                  <li>You agree not to use the Service for any illegal, unauthorized, or prohibited activities.</li>
                  <li>You must not attempt to disrupt, hack, or misuse the Service or its associated infrastructure.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">3. Intellectual Property</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>All content provided in this repository, including but not limited to code, text, graphics, and documentation, is the property of its respective authors and contributors.</li>
                  <li>The Service may be open-source and subject to a specific license (see LICENSE file for details). You must comply with the terms of the applicable license.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">4. Disclaimer of Warranties</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>The Service is provided without warranties of any kind, either express or implied.</li>
                  <li>The maintainers do not warrant that the Service will be error-free, secure, or uninterrupted.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">5. Limitation of Liability</h3>
                <p>
                  In no event shall the maintainers, contributors, or affiliates be liable for any direct, indirect, incidental, special, or consequential damages arising from your use of the Service.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">6. Modifications</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>The maintainers reserve the right to update or modify these Terms at any time. Changes will be posted in this file with a revised "last updated" date.</li>
                  <li>Continuing to use the Service after such changes constitutes your acceptance of the new Terms.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">7. Governing Law</h3>
                <p>
                  These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which the project maintainer resides, without regard to its conflict of law provisions.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">8. Contact</h3>
                <p>
                  For any questions about these Terms, please contact the repository maintainer via GitHub.
                </p>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
