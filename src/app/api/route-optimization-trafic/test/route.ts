import { NextRequest, NextResponse } from 'next/server';

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL || 'http://localhost:8000';

/**
 * GET /api/route-optimization-trafic/test
 * Endpoint de prueba para verificar conectividad con FastAPI
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('🔍 Probando conectividad con FastAPI...');
    console.log('FASTAPI_BASE_URL:', FASTAPI_BASE_URL);
    
    if (!FASTAPI_BASE_URL) {
      return NextResponse.json({
        success: false,
        error: 'FASTAPI_BASE_URL no está configurado',
        details: {
          message: 'Agrega FASTAPI_BASE_URL=http://localhost:8000 a tu archivo env.local'
        }
      }, { status: 500 });
    }

    const testUrl = `${FASTAPI_BASE_URL}/health`;
    console.log('Intentando conectar a:', testUrl);

    // Intentar conectar al FastAPI
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json().catch(() => ({}));
      return NextResponse.json({
        success: true,
        message: 'Conexión exitosa con FastAPI',
        details: {
          url: testUrl,
          status: response.status,
          response: data
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'FastAPI respondió con error',
        details: {
          url: testUrl,
          status: response.status,
          statusText: response.statusText
        }
      }, { status: response.status });
    }

  } catch (error) {
    console.error('❌ Error de conectividad:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('ECONNREFUSED')) {
        return NextResponse.json({
          success: false,
          error: 'No se puede conectar al FastAPI',
          details: {
            message: 'El servidor FastAPI no está ejecutándose o no es accesible',
            url: FASTAPI_BASE_URL,
            solution: 'Verifica que tu FastAPI esté ejecutándose en el puerto 8000',
            error: error.message
          }
        }, { status: 503 });
      }
      
      if (error.message.includes('ENOTFOUND')) {
        return NextResponse.json({
          success: false,
          error: 'URL del FastAPI no encontrada',
          details: {
            message: 'La URL configurada no es válida',
            url: FASTAPI_BASE_URL,
            solution: 'Verifica que FASTAPI_BASE_URL esté configurado correctamente',
            error: error.message
          }
        }, { status: 503 });
      }
    }
    
    return NextResponse.json({
      success: false,
      error: 'Error de conectividad desconocido',
      details: {
        message: error instanceof Error ? error.message : 'Error desconocido',
        url: FASTAPI_BASE_URL
      }
    }, { status: 500 });
  }
}
