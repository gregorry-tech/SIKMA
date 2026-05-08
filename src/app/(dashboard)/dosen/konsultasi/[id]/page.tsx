import DetailKonsultasiPage from './_client';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <DetailKonsultasiPage params={resolvedParams} />;
}
