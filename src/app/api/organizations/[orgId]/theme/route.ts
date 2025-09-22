import { NextRequest, NextResponse } from 'next/server';
import { OrganizationThemeConfig } from '@/types';

// GET - Obtener configuración de tema de la organización
export async function GET(
  request: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const { orgId } = params;

    // TODO: Implementar lógica para obtener el tema de la organización desde la base de datos
    // Por ahora, devolvemos una configuración por defecto
    const defaultTheme: OrganizationThemeConfig = {
      organization_uuid: orgId,
      theme_id: 'blue',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: defaultTheme,
    });
  } catch (error) {
    console.error('Error fetching organization theme:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener la configuración del tema',
      },
      { status: 500 }
    );
  }
}

// PUT - Actualizar configuración de tema de la organización
export async function PUT(
  request: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const { orgId } = params;
    const body = await request.json();

    // Validar datos de entrada
    const { theme_id, custom_logo_url, custom_favicon_url, custom_css } = body;

    if (!theme_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'theme_id es requerido',
        },
        { status: 400 }
      );
    }

    // TODO: Implementar lógica para guardar el tema de la organización en la base de datos
    const updatedTheme: OrganizationThemeConfig = {
      organization_uuid: orgId,
      theme_id,
      custom_logo_url: custom_logo_url || null,
      custom_favicon_url: custom_favicon_url || null,
      custom_css: custom_css || null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: updatedTheme,
      message: 'Configuración de tema actualizada correctamente',
    });
  } catch (error) {
    console.error('Error updating organization theme:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al actualizar la configuración del tema',
      },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar configuración de tema de la organización (restaurar por defecto)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const { orgId } = params;

    // TODO: Implementar lógica para eliminar el tema personalizado de la organización
    const defaultTheme: OrganizationThemeConfig = {
      organization_uuid: orgId,
      theme_id: 'blue',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: defaultTheme,
      message: 'Configuración de tema restaurada al valor por defecto',
    });
  } catch (error) {
    console.error('Error resetting organization theme:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al restaurar la configuración del tema',
      },
      { status: 500 }
    );
  }
}
