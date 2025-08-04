'use client'

import React, { useState } from 'react';
import { ChatWidget } from '@/components/widget/ChatWidget';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Palette, Settings, MessageCircle, TestTube } from 'lucide-react';

/**
 * Widget Test Page
 * For testing and demonstrating the chat widget functionality
 */
export default function WidgetTestPage() {
  const [widgetConfig, setWidgetConfig] = useState({
    position: 'bottom-right',
    theme: {
      primaryColor: '#3b82f6',
      textColor: '#1f2937',
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      fontFamily: 'Inter, sans-serif'
    },
    apiUrl: '/api/widget',
    widgetName: 'default'
  });

  const [showWidget, setShowWidget] = useState(true);

  // Simulate agent typing indicator for testing
  const simulateAgentTyping = async (isTyping) => {
    try {
      // Get the current session token from localStorage
      const savedSession = localStorage.getItem('widget_session');
      if (!savedSession) {
        alert('No active widget session found. Please start a chat first.');
        return;
      }

      const session = JSON.parse(savedSession);
      const response = await fetch('/api/widget/test-typing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionToken: session.sessionToken,
          isTyping,
          agentName: 'Test Agent'
        }),
      });

      const data = await response.json();
      if (data.success) {
        console.log(`Agent typing ${isTyping ? 'started' : 'stopped'}`);
      } else {
        console.error('Failed to simulate agent typing:', data.error);
      }
    } catch (error) {
      console.error('Error simulating agent typing:', error);
    }
  };

  // Handle theme changes
  const handleThemeChange = (key, value) => {
    setWidgetConfig(prev => ({
      ...prev,
      theme: {
        ...prev.theme,
        [key]: value
      }
    }));
  };

  // Handle config changes
  const handleConfigChange = (key, value) => {
    setWidgetConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Predefined themes
  const predefinedThemes = {
    default: {
      primaryColor: '#3b82f6',
      textColor: '#1f2937',
      backgroundColor: '#ffffff'
    },
    dark: {
      primaryColor: '#6366f1',
      textColor: '#f9fafb',
      backgroundColor: '#1f2937'
    },
    green: {
      primaryColor: '#10b981',
      textColor: '#1f2937',
      backgroundColor: '#ffffff'
    },
    purple: {
      primaryColor: '#8b5cf6',
      textColor: '#1f2937',
      backgroundColor: '#ffffff'
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Chat Widget Test Environment
          </h1>
          <p className="text-gray-600">
            Test and customize the chat widget functionality and appearance
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configuration Panel */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Widget Configuration
                </CardTitle>
                <CardDescription>
                  Customize the widget appearance and behavior
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="appearance" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="appearance">Appearance</TabsTrigger>
                    <TabsTrigger value="behavior">Behavior</TabsTrigger>
                    <TabsTrigger value="testing">Testing</TabsTrigger>
                  </TabsList>

                  {/* Appearance Tab */}
                  <TabsContent value="appearance" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {/* Position */}
                      <div className="space-y-2">
                        <Label>Position</Label>
                        <Select
                          value={widgetConfig.position}
                          onValueChange={(value) => handleConfigChange('position', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bottom-right">Bottom Right</SelectItem>
                            <SelectItem value="bottom-left">Bottom Left</SelectItem>
                            <SelectItem value="top-right">Top Right</SelectItem>
                            <SelectItem value="top-left">Top Left</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Border Radius */}
                      <div className="space-y-2">
                        <Label>Border Radius</Label>
                        <Select
                          value={widgetConfig.theme.borderRadius}
                          onValueChange={(value) => handleThemeChange('borderRadius', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="4px">Small (4px)</SelectItem>
                            <SelectItem value="8px">Medium (8px)</SelectItem>
                            <SelectItem value="12px">Large (12px)</SelectItem>
                            <SelectItem value="16px">Extra Large (16px)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Color Inputs */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Primary Color</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={widgetConfig.theme.primaryColor}
                            onChange={(e) => handleThemeChange('primaryColor', e.target.value)}
                            className="w-12 h-10 p-1 border rounded"
                          />
                          <Input
                            type="text"
                            value={widgetConfig.theme.primaryColor}
                            onChange={(e) => handleThemeChange('primaryColor', e.target.value)}
                            className="flex-1"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Text Color</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={widgetConfig.theme.textColor}
                            onChange={(e) => handleThemeChange('textColor', e.target.value)}
                            className="w-12 h-10 p-1 border rounded"
                          />
                          <Input
                            type="text"
                            value={widgetConfig.theme.textColor}
                            onChange={(e) => handleThemeChange('textColor', e.target.value)}
                            className="flex-1"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Background Color</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={widgetConfig.theme.backgroundColor}
                            onChange={(e) => handleThemeChange('backgroundColor', e.target.value)}
                            className="w-12 h-10 p-1 border rounded"
                          />
                          <Input
                            type="text"
                            value={widgetConfig.theme.backgroundColor}
                            onChange={(e) => handleThemeChange('backgroundColor', e.target.value)}
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Predefined Themes */}
                    <div className="space-y-2">
                      <Label>Quick Themes</Label>
                      <div className="flex gap-2">
                        {Object.entries(predefinedThemes).map(([name, theme]) => (
                          <Button
                            key={name}
                            variant="outline"
                            size="sm"
                            onClick={() => setWidgetConfig(prev => ({
                              ...prev,
                              theme: { ...prev.theme, ...theme }
                            }))}
                            className="capitalize"
                          >
                            {name}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  {/* Behavior Tab */}
                  <TabsContent value="behavior" className="space-y-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>Show Widget</Label>
                        <Switch
                          checked={showWidget}
                          onCheckedChange={setShowWidget}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>API URL</Label>
                        <Input
                          value={widgetConfig.apiUrl}
                          onChange={(e) => handleConfigChange('apiUrl', e.target.value)}
                          placeholder="/api/widget"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Widget Name</Label>
                        <Input
                          value={widgetConfig.widgetName}
                          onChange={(e) => handleConfigChange('widgetName', e.target.value)}
                          placeholder="default"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  {/* Testing Tab */}
                  <TabsContent value="testing" className="space-y-4">
                    <div className="space-y-4">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-semibold text-blue-900 mb-2">Test Scenarios</h4>
                        <ul className="text-sm text-blue-800 space-y-1">
                          <li>• Test customer onboarding flow</li>
                          <li>• Send messages and receive AI responses</li>
                          <li>• Test typing indicators</li>
                          <li>• Test session persistence</li>
                          <li>• Test different screen sizes</li>
                        </ul>
                      </div>

                      <div className="p-4 bg-yellow-50 rounded-lg">
                        <h4 className="font-semibold text-yellow-900 mb-2">Typing Indicator Test</h4>
                        <p className="text-sm text-yellow-800 mb-3">
                          Test the typing indicator by simulating an agent typing response.
                        </p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => simulateAgentTyping(true)}
                            className="bg-yellow-600 hover:bg-yellow-700"
                          >
                            Start Agent Typing
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => simulateAgentTyping(false)}
                          >
                            Stop Agent Typing
                          </Button>
                        </div>
                      </div>

                      <div className="p-4 bg-green-50 rounded-lg">
                        <h4 className="font-semibold text-green-900 mb-2">Integration Code</h4>
                        <pre className="text-xs text-green-800 bg-green-100 p-2 rounded overflow-x-auto">
{`<ChatWidget
  position="${widgetConfig.position}"
  theme={${JSON.stringify(widgetConfig.theme, null, 2)}}
  apiUrl="${widgetConfig.apiUrl}"
  widgetName="${widgetConfig.widgetName}"
/>`}
                        </pre>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Status Panel */}
          <div className="space-y-6">
            {/* Widget Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Widget Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Widget Visible</span>
                  <Badge variant={showWidget ? "default" : "secondary"}>
                    {showWidget ? "Active" : "Hidden"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Position</span>
                  <Badge variant="outline">{widgetConfig.position}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Theme</span>
                  <div
                    className="w-4 h-4 rounded border"
                    style={{ backgroundColor: widgetConfig.theme.primaryColor }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Test Instructions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TestTube className="h-5 w-5" />
                  Test Instructions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <h4 className="font-semibold mb-1">1. Open Widget</h4>
                  <p className="text-gray-600">Click the chat button to open the widget</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">2. Fill Customer Form</h4>
                  <p className="text-gray-600">Enter your details to start a conversation</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">3. Send Messages</h4>
                  <p className="text-gray-600">Test the AI responses and conversation flow</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">4. Test Features</h4>
                  <p className="text-gray-600">Try typing indicators, minimize/maximize, etc.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Demo Content */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Demo Website Content</CardTitle>
              <CardDescription>
                This simulates a regular website where the chat widget would be embedded
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <h2 className="text-2xl font-bold">Welcome to Fincorp Credit</h2>
              <p className="text-gray-600">
                We provide comprehensive financial services including loans, trade finance, 
                Islamic finance, and insurance solutions. Our AI-powered chat assistant 
                is here to help you with any questions you might have.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Business Loans</h3>
                  <p className="text-sm text-gray-600">
                    Flexible financing solutions for your business growth
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Trade Finance</h3>
                  <p className="text-sm text-gray-600">
                    Import/export financing and trade facilitation services
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Islamic Finance</h3>
                  <p className="text-sm text-gray-600">
                    Shariah-compliant financial products and services
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Chat Widget */}
      {showWidget && (
        <ChatWidget
          position={widgetConfig.position}
          theme={widgetConfig.theme}
          apiUrl={widgetConfig.apiUrl}
          widgetName={widgetConfig.widgetName}
        />
      )}
    </div>
  );
}
