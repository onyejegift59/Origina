import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { safeFileName } from '@/lib/security';
import { getProject, getProjectArtifacts, createExportRecord } from '@/lib/supabase/queries';
import jsPDF from 'jspdf';

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { success: false, error: { message: 'Unauthorized' } },
      { status: 401 }
    );
  }

  const body = await request.json();
  const { projectId } = body;

  if (!projectId) {
    return NextResponse.json(
      { success: false, error: { message: 'Project ID is required' } },
      { status: 400 }
    );
  }

  const project = await getProject(projectId, user.id);
  if (!project) {
    return NextResponse.json(
      { success: false, error: { message: 'Project not found' } },
      { status: 404 }
    );
  }

  const artifacts = await getProjectArtifacts(projectId);
  const artifactMap = artifacts.reduce((acc, a) => {
    acc[a.type] = a.content;
    return acc;
  }, {} as Record<string, unknown>);

  const doc = new jsPDF();
  let y = 20;

  function addText(text: string, size = 12, isBold = false) {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(size);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    const lines = doc.splitTextToSize(text, 170);
    doc.text(lines, 20, y);
    y += lines.length * (size * 0.35) + 4;
  }

  addText(project.name, 24, true);
  addText(`Idea: ${project.idea}`, 11);
  y += 8;

  const analysis = artifactMap['startup_analysis'] as { problemStatement?: string; targetAudience?: string; valueProposition?: string; marketOpportunity?: string } | undefined;
  if (analysis) {
    addText('Startup Analysis', 16, true);
    addText(`Problem: ${analysis.problemStatement || ''}`, 10);
    addText(`Audience: ${analysis.targetAudience || ''}`, 10);
    addText(`Value: ${analysis.valueProposition || ''}`, 10);
    y += 4;
  }

  const personas = artifactMap['personas'] as { personas?: Array<{ name?: string; role?: string; goals?: string[]; painPoints?: string[] }> } | undefined;
  if (personas?.personas) {
    addText('User Personas', 16, true);
    for (const p of personas.personas) {
      addText(`${p.name} - ${p.role}`, 12, true);
      if (p.goals?.length) addText(`Goals: ${p.goals.join(', ')}`, 10);
      if (p.painPoints?.length) addText(`Pain Points: ${p.painPoints.join(', ')}`, 10);
      y += 2;
    }
  }

  const pdfBuffer = new Uint8Array(doc.output('arraybuffer') as ArrayBuffer);
  const storageClient = await createServerSupabaseClient();
  const fileName = safeFileName(project.name, 'pdf');
  const storagePath = `${user.id}/${projectId}/${fileName}`;

  const { data: uploadData, error: uploadError } = await storageClient.storage
    .from('exports')
    .upload(storagePath, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true,
    });

  if (uploadError) {
    console.error('[export/pdf] Storage upload failed:', uploadError.message);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to save export file.' } },
      { status: 500 }
    );
  }

  if (uploadData) {
    await createExportRecord(projectId, 'pdf', uploadData.path);
  }

  return new Response(pdfBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    },
  });
}
