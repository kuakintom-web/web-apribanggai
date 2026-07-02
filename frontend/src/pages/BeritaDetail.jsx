import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import api from '../../services/api';
import Loading from '../../components/common/Loading';
import NotFound from '../../components/common/NotFound';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

const BeritaDetail = () => {
  const { slug } = useParams();
  const [berita, setBerita] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchBerita = async () => {
      try {
        const response = await api.get(`/berita/${slug}`);
        setBerita(response.data);
        setError(false);
      } catch (err) {
        console.error('Error:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchBerita();
  }, [slug]);

  if (loading) return <Loading />;
  if (error || !berita) return <NotFound />;

  return (
    <>
      <Navbar />
      <div className="bg-gray-50 py-8">
        <article className="container max-w-3xl">
          <div className="card">
            {berita.featured_image && (
              <img
                src={berita.featured_image}
                alt={berita.title}
                className="w-full h-96 object-cover rounded-lg mb-6"
              />
            )}

            <header className="mb-6 border-b border-gray-200 pb-6">
              <h1 className="text-4xl font-bold mb-4">{berita.title}</h1>
              <div className="flex items-center gap-4 text-gray-600">
                <span className="badge badge-primary">{berita.category}</span>
                <span className="text-sm">
                  {formatDistanceToNow(new Date(berita.published_at), {
                    addSuffix: true,
                    locale: id,
                  })}
                </span>
                <span className="text-sm">Oleh: {berita.author}</span>
                <span className="text-sm">{berita.views} views</span>
              </div>
            </header>

            <div className="prose max-w-none">
              {berita.content.split('\n').map((paragraph, index) => (
                <p key={index} className="text-gray-700 leading-relaxed mb-4">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </article>
      </div>
      <Footer />
    </>
  );
};

export default BeritaDetail;
