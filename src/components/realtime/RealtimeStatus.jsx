'use client'

import React, { useState } from 'react';
import { Wifi, WifiOff, RefreshCw, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useRealtime } from '@/context/realtimeContext';

/**
 * Real-time Status Component
 * Shows connection status and provides reconnection controls
 */
export const RealtimeStatus = ({ className, showLabel = false, ...props }) => {
  const { 
    isConnected, 
    connectionStatus, 
    reconnect, 
    getConnectionStatus 
  } = useRealtime();
  
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [statusDetails, setStatusDetails] = useState(null);

  // Handle reconnection
  const handleReconnect = async () => {
    setIsReconnecting(true);
    try {
      await reconnect();
    } catch (error) {
      console.error('Reconnection failed:', error);
    } finally {
      setIsReconnecting(false);
    }
  };

  // Load detailed status
  const loadStatusDetails = () => {
    if (getConnectionStatus) {
      setStatusDetails(getConnectionStatus());
    }
  };

  // Get status icon and color
  const getStatusDisplay = () => {
    switch (connectionStatus) {
      case 'connected':
        return {
          icon: <CheckCircle className="h-4 w-4" />,
          color: 'text-green-500',
          bgColor: 'bg-green-500',
          label: 'Connected',
          description: 'Real-time updates are active'
        };
      case 'connecting':
        return {
          icon: <Clock className="h-4 w-4 animate-pulse" />,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-500',
          label: 'Connecting',
          description: 'Establishing real-time connection'
        };
      case 'failed':
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          color: 'text-red-500',
          bgColor: 'bg-red-500',
          label: 'Failed',
          description: 'Real-time connection failed'
        };
      case 'disconnected':
      default:
        return {
          icon: <WifiOff className="h-4 w-4" />,
          color: 'text-gray-500',
          bgColor: 'bg-gray-500',
          label: 'Disconnected',
          description: 'Real-time updates are disabled'
        };
    }
  };

  const status = getStatusDisplay();

  // Simple indicator (no popover)
  if (!showLabel) {
    return (
      <div
        className={cn('flex items-center gap-2', className)}
        title={`${status.label}: ${status.description}`}
        {...props}
      >
        <div className={cn('relative', status.color)}>
          {status.icon}
          <div
            className={cn(
              'absolute -top-1 -right-1 h-2 w-2 rounded-full',
              status.bgColor
            )}
          />
        </div>
        {showLabel && (
          <span className="text-sm text-gray-600">{status.label}</span>
        )}
      </div>
    );
  }

  // Full status with popover
  return (
    <Popover onOpenChange={(open) => open && loadStatusDetails()}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn('flex items-center gap-2 h-8', className)}
          {...props}
        >
          <div className={cn('relative', status.color)}>
            {status.icon}
            <div
              className={cn(
                'absolute -top-1 -right-1 h-2 w-2 rounded-full',
                status.bgColor
              )}
            />
          </div>
          <span className="text-sm">{status.label}</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Real-time Status</h3>
            <Badge
              variant={isConnected ? "default" : "secondary"}
              className={cn(
                isConnected ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              )}
            >
              {status.label}
            </Badge>
          </div>

          {/* Status Description */}
          <div className="flex items-start gap-3">
            <div className={cn('mt-0.5', status.color)}>
              {status.icon}
            </div>
            <div>
              <p className="text-sm font-medium">{status.label}</p>
              <p className="text-sm text-gray-600">{status.description}</p>
            </div>
          </div>

          <Separator />

          {/* Connection Details */}
          {statusDetails && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Connection Details</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className={status.color}>{statusDetails.isConnected ? 'Connected' : 'Disconnected'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Active Subscriptions:</span>
                  <span>{statusDetails.activeSubscriptions || 0}</span>
                </div>
                {statusDetails.subscriptions && statusDetails.subscriptions.length > 0 && (
                  <div>
                    <span>Subscriptions:</span>
                    <ul className="mt-1 ml-2 space-y-0.5">
                      {statusDetails.subscriptions.map((sub, index) => (
                        <li key={index} className="text-xs text-gray-500">
                          • {sub}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          <Separator />

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500">
              {isConnected ? 'Updates are live' : 'Updates may be delayed'}
            </div>
            
            {!isConnected && (
              <Button
                size="sm"
                onClick={handleReconnect}
                disabled={isReconnecting}
                className="h-8"
              >
                {isReconnecting ? (
                  <>
                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wifi className="h-3 w-3 mr-1" />
                    Reconnect
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Help Text */}
          <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
            <p className="font-medium mb-1">Real-time Features:</p>
            <ul className="space-y-0.5">
              <li>• Live chat messages</li>
              <li>• Instant notifications</li>
              <li>• Typing indicators</li>
              <li>• Online status updates</li>
            </ul>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default RealtimeStatus;
