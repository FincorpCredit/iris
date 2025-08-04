/**
 * Chat Widget Test Suite
 * Comprehensive tests for chat widget functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChatWidget } from '@/components/widget/ChatWidget';
import { useWidgetChat } from '@/components/widget/hooks/useWidgetChat';

// Mock the custom hook
vi.mock('@/components/widget/hooks/useWidgetChat');

// Mock fetch
global.fetch = vi.fn();

describe('ChatWidget', () => {
  const mockHookReturn = {
    session: null,
    messages: [],
    isLoading: false,
    isConnected: true,
    typingIndicators: [],
    settings: {
      isEnabled: true,
      welcomeMessage: 'Hi! How can I help you today?',
      currentMessage: 'Hi! How can I help you today?',
      theme: {
        primaryColor: '#3b82f6',
        textColor: '#1f2937',
        backgroundColor: '#ffffff'
      },
      showAgentPhotos: true,
      showTypingIndicator: true,
      requireEmail: true,
      requireName: true
    },
    error: null,
    sendMessage: vi.fn(),
    startSession: vi.fn(),
    endSession: vi.fn(),
    setTyping: vi.fn(),
    markMessagesAsRead: vi.fn()
  };

  beforeEach(() => {
    useWidgetChat.mockReturnValue(mockHookReturn);
    fetch.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Widget Rendering', () => {
    it('renders chat button when closed', () => {
      render(<ChatWidget />);
      
      const chatButton = screen.getByRole('button', { name: /open chat/i });
      expect(chatButton).toBeInTheDocument();
    });

    it('does not render when widget is disabled', () => {
      useWidgetChat.mockReturnValue({
        ...mockHookReturn,
        settings: { ...mockHookReturn.settings, isEnabled: false }
      });

      const { container } = render(<ChatWidget />);
      expect(container.firstChild).toBeNull();
    });

    it('applies custom theme colors', () => {
      const customTheme = {
        primaryColor: '#ff0000',
        textColor: '#000000',
        backgroundColor: '#ffffff'
      };

      render(<ChatWidget theme={customTheme} />);
      
      const chatButton = screen.getByRole('button', { name: /open chat/i });
      expect(chatButton).toHaveStyle({ backgroundColor: '#ff0000' });
    });

    it('positions widget correctly', () => {
      const { container } = render(<ChatWidget position="top-left" />);
      
      const widget = container.firstChild;
      expect(widget).toHaveClass('top-4', 'left-4');
    });
  });

  describe('Customer Form', () => {
    it('shows customer form when no session exists', async () => {
      render(<ChatWidget />);
      
      // Open widget
      const chatButton = screen.getByRole('button', { name: /open chat/i });
      fireEvent.click(chatButton);

      await waitFor(() => {
        expect(screen.getByText('Start a Conversation')).toBeInTheDocument();
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      });
    });

    it('validates required fields', async () => {
      render(<ChatWidget />);
      
      // Open widget
      const chatButton = screen.getByRole('button', { name: /open chat/i });
      fireEvent.click(chatButton);

      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /start conversation/i });
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Email is required to start the conversation')).toBeInTheDocument();
      });
    });

    it('submits customer form with valid data', async () => {
      const mockStartSession = vi.fn().mockResolvedValue({});
      useWidgetChat.mockReturnValue({
        ...mockHookReturn,
        startSession: mockStartSession
      });

      render(<ChatWidget />);
      
      // Open widget
      const chatButton = screen.getByRole('button', { name: /open chat/i });
      fireEvent.click(chatButton);

      await waitFor(() => {
        const emailInput = screen.getByLabelText(/email/i);
        const nameInput = screen.getByLabelText(/name/i);
        const submitButton = screen.getByRole('button', { name: /start conversation/i });

        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(nameInput, { target: { value: 'John Doe' } });
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(mockStartSession).toHaveBeenCalledWith({
          email: 'test@example.com',
          name: 'John Doe',
          phone: null,
          metadata: expect.objectContaining({
            source: 'widget'
          })
        });
      });
    });
  });

  describe('Chat Interface', () => {
    beforeEach(() => {
      useWidgetChat.mockReturnValue({
        ...mockHookReturn,
        session: {
          id: 'session-123',
          sessionToken: 'token-123',
          isActive: true
        }
      });
    });

    it('shows welcome message when no messages exist', async () => {
      render(<ChatWidget />);
      
      // Open widget
      const chatButton = screen.getByRole('button', { name: /open chat/i });
      fireEvent.click(chatButton);

      await waitFor(() => {
        expect(screen.getByText('Hi! How can I help you today?')).toBeInTheDocument();
      });
    });

    it('displays chat messages', async () => {
      const messages = [
        {
          id: 'msg-1',
          content: 'Hello',
          senderType: 'CUSTOMER',
          isFromAI: false,
          createdAt: new Date().toISOString()
        },
        {
          id: 'msg-2',
          content: 'Hi! How can I help you?',
          senderType: 'AI',
          isFromAI: true,
          createdAt: new Date().toISOString()
        }
      ];

      useWidgetChat.mockReturnValue({
        ...mockHookReturn,
        session: { id: 'session-123' },
        messages
      });

      render(<ChatWidget />);
      
      // Open widget
      const chatButton = screen.getByRole('button', { name: /open chat/i });
      fireEvent.click(chatButton);

      await waitFor(() => {
        expect(screen.getByText('Hello')).toBeInTheDocument();
        expect(screen.getByText('Hi! How can I help you?')).toBeInTheDocument();
      });
    });

    it('sends messages when form is submitted', async () => {
      const mockSendMessage = vi.fn().mockResolvedValue({});
      useWidgetChat.mockReturnValue({
        ...mockHookReturn,
        session: { id: 'session-123' },
        sendMessage: mockSendMessage
      });

      render(<ChatWidget />);
      
      // Open widget
      const chatButton = screen.getByRole('button', { name: /open chat/i });
      fireEvent.click(chatButton);

      await waitFor(() => {
        const messageInput = screen.getByPlaceholderText(/type your message/i);
        const sendButton = screen.getByRole('button', { name: /send/i });

        fireEvent.change(messageInput, { target: { value: 'Test message' } });
        fireEvent.click(sendButton);
      });

      expect(mockSendMessage).toHaveBeenCalledWith('Test message');
    });

    it('handles typing indicators', async () => {
      const mockSetTyping = vi.fn();
      useWidgetChat.mockReturnValue({
        ...mockHookReturn,
        session: { id: 'session-123' },
        setTyping: mockSetTyping
      });

      render(<ChatWidget />);
      
      // Open widget
      const chatButton = screen.getByRole('button', { name: /open chat/i });
      fireEvent.click(chatButton);

      await waitFor(() => {
        const messageInput = screen.getByPlaceholderText(/type your message/i);
        
        // Start typing
        fireEvent.change(messageInput, { target: { value: 'T' } });
      });

      // Should call setTyping with true
      await waitFor(() => {
        expect(mockSetTyping).toHaveBeenCalledWith(true);
      });
    });

    it('shows typing indicators from other users', async () => {
      const typingIndicators = [
        {
          id: 'typing-1',
          userType: 'AGENT',
          user: { name: 'Agent Smith' }
        }
      ];

      useWidgetChat.mockReturnValue({
        ...mockHookReturn,
        session: { id: 'session-123' },
        typingIndicators,
        settings: {
          ...mockHookReturn.settings,
          showTypingIndicator: true
        }
      });

      render(<ChatWidget />);
      
      // Open widget
      const chatButton = screen.getByRole('button', { name: /open chat/i });
      fireEvent.click(chatButton);

      await waitFor(() => {
        expect(screen.getByText(/Agent Smith is typing/i)).toBeInTheDocument();
      });
    });
  });

  describe('Widget Controls', () => {
    it('minimizes and maximizes widget', async () => {
      render(<ChatWidget />);
      
      // Open widget
      const chatButton = screen.getByRole('button', { name: /open chat/i });
      fireEvent.click(chatButton);

      await waitFor(() => {
        const minimizeButton = screen.getByRole('button', { name: /minimize/i });
        fireEvent.click(minimizeButton);
      });

      // Widget should be minimized (header only)
      expect(screen.queryByPlaceholderText(/type your message/i)).not.toBeInTheDocument();

      // Maximize again
      const maximizeButton = screen.getByRole('button', { name: /maximize/i });
      fireEvent.click(maximizeButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/type your message/i)).toBeInTheDocument();
      });
    });

    it('closes widget and ends session', async () => {
      const mockEndSession = vi.fn();
      useWidgetChat.mockReturnValue({
        ...mockHookReturn,
        session: { id: 'session-123' },
        endSession: mockEndSession
      });

      render(<ChatWidget />);
      
      // Open widget
      const chatButton = screen.getByRole('button', { name: /open chat/i });
      fireEvent.click(chatButton);

      await waitFor(() => {
        const closeButton = screen.getByRole('button', { name: /close/i });
        fireEvent.click(closeButton);
      });

      expect(mockEndSession).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('displays error messages', async () => {
      useWidgetChat.mockReturnValue({
        ...mockHookReturn,
        error: 'Failed to send message'
      });

      render(<ChatWidget />);
      
      // Open widget
      const chatButton = screen.getByRole('button', { name: /open chat/i });
      fireEvent.click(chatButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to send message')).toBeInTheDocument();
      });
    });

    it('handles loading states', async () => {
      useWidgetChat.mockReturnValue({
        ...mockHookReturn,
        isLoading: true
      });

      render(<ChatWidget />);
      
      // Open widget and try to send message
      const chatButton = screen.getByRole('button', { name: /open chat/i });
      fireEvent.click(chatButton);

      await waitFor(() => {
        const sendButton = screen.getByRole('button', { name: /send/i });
        expect(sendButton).toBeDisabled();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<ChatWidget />);
      
      const chatButton = screen.getByRole('button', { name: /open chat/i });
      expect(chatButton).toHaveAttribute('aria-label', 'Open chat');
    });

    it('supports keyboard navigation', async () => {
      render(<ChatWidget />);
      
      // Open widget with Enter key
      const chatButton = screen.getByRole('button', { name: /open chat/i });
      fireEvent.keyDown(chatButton, { key: 'Enter' });

      await waitFor(() => {
        expect(screen.getByText('Start a Conversation')).toBeInTheDocument();
      });
    });

    it('has proper focus management', async () => {
      useWidgetChat.mockReturnValue({
        ...mockHookReturn,
        session: { id: 'session-123' }
      });

      render(<ChatWidget />);
      
      // Open widget
      const chatButton = screen.getByRole('button', { name: /open chat/i });
      fireEvent.click(chatButton);

      await waitFor(() => {
        const messageInput = screen.getByPlaceholderText(/type your message/i);
        expect(messageInput).toBeInTheDocument();
        
        // Focus should be on message input
        messageInput.focus();
        expect(document.activeElement).toBe(messageInput);
      });
    });
  });
});
