'use client';

import React, { Component, ReactNode } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Props {
  children: ReactNode;
  open: boolean;
  onClose: () => void;
  userId: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AgentAccessDialogErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    console.error('[AGENT-DIALOG-EB] Error caught:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[AGENT-DIALOG-EB] Caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Dialog open={this.props.open} onOpenChange={this.props.onClose}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Erreur</DialogTitle>
            </DialogHeader>
            <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded">
              <p className="text-sm text-red-600 dark:text-red-300 mb-2">
                Une erreur s'est produite lors du chargement du dialog.
              </p>
              <p className="text-xs text-red-500 dark:text-red-400 font-mono break-words">
                {this.state.error?.message || 'Erreur inconnue'}
              </p>
            </div>
          </DialogContent>
        </Dialog>
      );
    }

    return this.props.children;
  }
}
