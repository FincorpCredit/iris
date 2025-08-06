import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * GET /api/test/supabase
 * Test Supabase connection and real-time capabilities
 */
export async function GET(request) {
  try {
    const results = {
      environment: {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseAnonKey,
        url: supabaseUrl,
        keyLength: supabaseAnonKey ? supabaseAnonKey.length : 0
      },
      connection: null,
      realtime: null,
      error: null
    };

    if (!supabaseUrl || !supabaseAnonKey) {
      results.error = 'Missing Supabase credentials';
      return NextResponse.json(results);
    }

    // Test basic connection
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    try {
      // Test a simple query to check connection
      const { data, error } = await supabase
        .from('message')
        .select('id')
        .limit(1);
      
      results.connection = {
        success: !error,
        error: error?.message,
        hasData: !!data
      };
    } catch (connError) {
      results.connection = {
        success: false,
        error: connError.message
      };
    }

    // Test real-time subscription
    try {
      const channel = supabase.channel('test-channel');
      
      const subscription = channel
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'message'
        }, (payload) => {
          console.log('Test subscription received:', payload);
        })
        .subscribe((status, err) => {
          console.log('Test subscription status:', status, err);
        });

      // Wait a moment to see if subscription succeeds
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      results.realtime = {
        channelCreated: !!channel,
        subscriptionCreated: !!subscription,
        status: 'pending'
      };

      // Clean up
      subscription.unsubscribe();
      
    } catch (realtimeError) {
      results.realtime = {
        success: false,
        error: realtimeError.message
      };
    }

    return NextResponse.json(results);

  } catch (error) {
    console.error('Supabase test error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to test Supabase connection',
        details: error.message,
        environment: {
          hasUrl: !!supabaseUrl,
          hasKey: !!supabaseAnonKey
        }
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/test/supabase
 * Test creating a real-time subscription and broadcasting
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { action = 'test' } = body;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Missing Supabase credentials' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    if (action === 'broadcast') {
      // Test broadcasting
      const channel = supabase.channel('test-broadcast');
      
      const result = await channel.send({
        type: 'broadcast',
        event: 'test',
        payload: { message: 'Hello from API', timestamp: new Date().toISOString() }
      });

      return NextResponse.json({
        success: true,
        action: 'broadcast',
        result
      });
    }

    return NextResponse.json({
      success: true,
      action,
      message: 'Test completed'
    });

  } catch (error) {
    console.error('Supabase POST test error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to test Supabase POST',
        details: error.message
      },
      { status: 500 }
    );
  }
}
