import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getProject, getProjectArtifacts, createExportRecord } from '@/lib/supabase/queries';
import { safeFileName } from '@/lib/security';
import PptxGenJS from 'pptxgenjs';

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

  const pptx = new PptxGenJS();
  pptx.author = 'Origina';
  pptx.title = project.name;

  const cover = pptx.addSlide();
  cover.background = { color: '2D3A2D' };
  cover.addText(project.name, { x: 1, y: 2, w: 8, h: 1.5, fontSize: 36, color: 'F5F0E8', fontFace: 'Helvetica', bold: true });
  cover.addText('Product Strategy Report', { x: 1, y: 3.5, w: 8, h: 0.8, fontSize: 18, color: 'A8B5A0', fontFace: 'Helvetica' });

  const analysis = artifactMap['startup_analysis'] as { problemStatement?: string; targetAudience?: string; valueProposition?: string } | undefined;
  if (analysis) {
    const slide = pptx.addSlide();
    slide.background = { color: 'F5F0E8' };
    slide.addText('Problem', { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 28, color: '2D3A2D', fontFace: 'Helvetica', bold: true });
    slide.addText(analysis.problemStatement || '', { x: 0.5, y: 1.2, w: 9, h: 1.5, fontSize: 14, color: '333333', fontFace: 'Helvetica' });

    const slide2 = pptx.addSlide();
    slide2.background = { color: 'F5F0E8' };
    slide2.addText('Target Audience', { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 28, color: '2D3A2D', fontFace: 'Helvetica', bold: true });
    slide2.addText(analysis.targetAudience || '', { x: 0.5, y: 1.2, w: 9, h: 1.5, fontSize: 14, color: '333333', fontFace: 'Helvetica' });

    const slide3 = pptx.addSlide();
    slide3.background = { color: 'F5F0E8' };
    slide3.addText('Value Proposition', { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 28, color: '2D3A2D', fontFace: 'Helvetica', bold: true });
    slide3.addText(analysis.valueProposition || '', { x: 0.5, y: 1.2, w: 9, h: 1.5, fontSize: 14, color: '333333', fontFace: 'Helvetica' });
  }

  const personas = artifactMap['personas'] as { personas?: Array<{ name?: string; role?: string; goals?: string[] }> } | undefined;
  if (personas?.personas) {
    for (const p of personas.personas) {
      const slide = pptx.addSlide();
      slide.background = { color: 'F5F0E8' };
      slide.addText(`${p.name} — ${p.role}`, { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 24, color: '2D3A2D', fontFace: 'Helvetica', bold: true });
      if (p.goals?.length) slide.addText(`Goals:\n${p.goals.map((g: string) => `• ${g}`).join('\n')}`, { x: 0.5, y: 1.2, w: 9, h: 2, fontSize: 12, color: '333333', fontFace: 'Helvetica' });
    }
  }

  const mvp = artifactMap['mvp_scope'] as { mustHave?: string[] } | undefined;
  if (mvp) {
    const slide = pptx.addSlide();
    slide.background = { color: 'F5F0E8' };
    slide.addText('MVP Scope', { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 28, color: '2D3A2D', fontFace: 'Helvetica', bold: true });
    const mustHave = mvp.mustHave?.map((f: string) => `• ${f}`).join('\n') || '';
    slide.addText(`Must Have:\n${mustHave}`, { x: 0.5, y: 1.2, w: 9, h: 3, fontSize: 12, color: '333333', fontFace: 'Helvetica' });
  }

  const roadmap = artifactMap['roadmap'] as { phase1?: string[]; phase2?: string[]; phase3?: string[] } | undefined;
  if (roadmap) {
    const slide = pptx.addSlide();
    slide.background = { color: 'F5F0E8' };
    slide.addText('Roadmap', { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 28, color: '2D3A2D', fontFace: 'Helvetica', bold: true });
    const phases = [];
    if (roadmap.phase1?.length) phases.push(`Phase 1:\n${roadmap.phase1.map((i: string) => `• ${i}`).join('\n')}`);
    if (roadmap.phase2?.length) phases.push(`Phase 2:\n${roadmap.phase2.map((i: string) => `• ${i}`).join('\n')}`);
    if (roadmap.phase3?.length) phases.push(`Phase 3:\n${roadmap.phase3.map((i: string) => `• ${i}`).join('\n')}`);
    slide.addText(phases.join('\n\n'), { x: 0.5, y: 1.2, w: 9, h: 4, fontSize: 12, color: '333333', fontFace: 'Helvetica' });
  }

  const health = artifactMap['health_score'] as { score?: number; recommendations?: string[] } | undefined;
  if (health) {
    const slide = pptx.addSlide();
    slide.background = { color: '2D3A2D' };
    slide.addText('Project Health Score', { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 28, color: 'F5F0E8', fontFace: 'Helvetica', bold: true });
    slide.addText(`Score: ${health.score}/100`, { x: 0.5, y: 1.2, w: 9, h: 0.8, fontSize: 20, color: 'A8B5A0', fontFace: 'Helvetica' });
    if (health.recommendations?.length) {
      slide.addText(`Recommendations:\n${health.recommendations.map((r: string) => `• ${r}`).join('\n')}`, { x: 0.5, y: 2.2, w: 9, h: 3, fontSize: 12, color: 'F5F0E8', fontFace: 'Helvetica' });
    }
  }

  const pptxResult = await pptx.write({ outputType: 'arraybuffer' });
  const storageClient = await createServerSupabaseClient();
  const fileName = safeFileName(project.name, 'pptx');
  const storagePath = `${user.id}/${projectId}/${fileName}`;

  const { data: uploadData, error: uploadError } = await storageClient.storage
    .from('exports')
    .upload(storagePath, new Uint8Array(pptxResult as ArrayBuffer), {
      contentType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      upsert: true,
    });

  if (uploadError) {
    console.error('[export/pptx] Storage upload failed:', uploadError.message);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to save export file.' } },
      { status: 500 }
    );
  }

  if (uploadData) {
    await createExportRecord(projectId, 'pptx', uploadData.path);
  }

  return new Response(new Uint8Array(pptxResult as ArrayBuffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    },
  });
}
