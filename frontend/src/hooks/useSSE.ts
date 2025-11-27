import { useEffect, useRef, useState } from 'react';

interface SSEMessage {
  type: string;
  data: any;
}

export function useSSE(url: string, enabled: boolean = true, requireAuth: boolean = true) {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<Error | null>(null);
  const [connected, setConnected] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!enabled || !url) return;

    const token = localStorage.getItem('token');
    
    // If auth is required but no token, don't connect
    if (requireAuth && !token) {
      setError(new Error('Authentication required'));
      return;
    }

    // Create abort controller for cleanup
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Use fetch API with ReadableStream to support custom headers
    const connectSSE = async () => {
      try {
        const headers: HeadersInit = {
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
        };

        // Add Authorization header if token exists
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(url, {
          method: 'GET',
          headers,
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error(`SSE connection failed: ${response.status} ${response.statusText}`);
        }

        if (!response.body) {
          throw new Error('Response body is null');
        }

        setConnected(true);
        setError(null);

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        const readStream = async () => {
          try {
            while (true) {
              const { done, value } = await reader.read();

              if (done) {
                setConnected(false);
                break;
              }

              // Decode the chunk and add to buffer
              buffer += decoder.decode(value, { stream: true });

              // Process complete SSE messages (messages end with \n\n)
              let eventEndIndex = buffer.indexOf('\n\n');
              
              while (eventEndIndex !== -1) {
                const eventData = buffer.substring(0, eventEndIndex);
                buffer = buffer.substring(eventEndIndex + 2);

                // Parse SSE event
                const lines = eventData.split('\n');
                let dataLine = '';

                for (const line of lines) {
                  if (line.startsWith('data: ')) {
                    dataLine = line.substring(6); // Remove 'data: ' prefix
                  }
                }

                // Parse JSON data if present
                if (dataLine.trim()) {
                  try {
                    const message: SSEMessage = JSON.parse(dataLine);
                    setData(message);
                  } catch (err) {
                    console.error('Error parsing SSE message:', err, dataLine);
                  }
                }

                // Check for next event
                eventEndIndex = buffer.indexOf('\n\n');
              }
            }
          } catch (err: any) {
            if (err.name !== 'AbortError') {
              setError(new Error('SSE connection error'));
              setConnected(false);
            }
          }
        };

        readStream();
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setError(err);
          setConnected(false);
        }
      }
    };

    connectSSE();

    return () => {
      abortController.abort();
      abortControllerRef.current = null;
    };
  }, [url, enabled, requireAuth]);

  return { data, error, connected };
}

