// Official Maxx logo — served from /public/logo.png
export default function Logo({ className = 'h-10 w-10' }) {
  return (
    <img
      src="/logo.png"
      alt="Maxx"
      className={`${className} object-contain`}
      width="64"
      height="64"
      loading="eager"
      decoding="async"
    />
  );
}
