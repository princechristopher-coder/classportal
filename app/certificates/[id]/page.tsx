'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CertificateTemplate, { CertificateData } from '@/components/certificate/CertificateTemplate';
import { Button, Spinner } from '@/components/ui/index';

export default function CertificatePage() {
  const { id } = useParams<{ id: string }>();
  const [certificate, setCertificate] = useState<CertificateData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/certificates/${id}`, { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).error || 'Failed to load certificate.');
        return res.json();
      })
      .then((data) => {
        const c = data.certificate;
        setCertificate({
          certificateNo: c.certificateNo,
          issuedAt: c.issuedAt,
          studentName: c.user.fullName,
          courseTitle: c.course.title,
          courseLevel: c.course.level
        });
      })
      .catch((err) => setError(err.message));
  }, [id]);

  const verifyUrl =
    certificate && typeof window !== 'undefined'
      ? `${window.location.origin}/verify/${certificate.certificateNo}`
      : '';

  const handleDownload = async () => {
    if (!wrapperRef.current || !certificate) return;
    setDownloading(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const canvas = await html2canvas(wrapperRef.current, {
        scale: 3,
        backgroundColor: '#f8f7f4',
        useCORS: true
      });

      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const imgRatio = canvas.width / canvas.height;
      let renderWidth = pageWidth;
      let renderHeight = pageWidth / imgRatio;
      if (renderHeight > pageHeight) {
        renderHeight = pageHeight;
        renderWidth = pageHeight * imgRatio;
      }
      const x = (pageWidth - renderWidth) / 2;
      const y = (pageHeight - renderHeight) / 2;

      pdf.addImage(imgData, 'PNG', x, y, renderWidth, renderHeight, undefined, 'FAST');
      pdf.save(`ClassPortal-${certificate.courseTitle.replace(/\s+/g, '-')}-Certificate.pdf`);
    } catch (err) {
      console.error(err);
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (error) {
    return (
      <>
        <Navbar />
        <div className="mx-auto max-w-2xl px-6 py-24 text-center text-cf-red">{error}</div>
        <Footer />
      </>
    );
  }

  if (!certificate) {
    return (
      <>
        <Navbar />
        <div className="flex justify-center py-32">
          <Spinner />
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <div className="no-print">
        <Navbar />
      </div>

      <section className="mx-auto max-w-5xl px-6 py-14">
        <div className="no-print mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold">Your Certificate</h1>
            <p className="text-sm text-white/50">{certificate.certificateNo}</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="!px-5 !py-2.5" onClick={handlePrint}>
              Print Certificate
            </Button>
            <Button variant="gold" className="!px-5 !py-2.5" loading={downloading} onClick={handleDownload}>
              Download PDF
            </Button>
          </div>
        </div>

        <div ref={wrapperRef}>
          <CertificateTemplate data={certificate} verifyUrl={verifyUrl} />
        </div>
      </section>

      <div className="no-print">
        <Footer />
      </div>
    </>
  );
}
