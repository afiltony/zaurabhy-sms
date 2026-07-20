export default function DealerCta() {
  return (
    <section
      id="dealers"
      className="mx-4 my-5 rounded-3xl bg-teal px-6 py-14 text-center text-white sm:mx-6 lg:mx-8"
    >
      <h2 className="font-heading text-4xl font-extrabold sm:text-5xl">
        Ready to become our dealer?
      </h2>
      <p className="mx-auto mt-3 max-w-lg text-lg text-[#ffe9e2]">
        Join retailers and wholesalers across India and international
        markets.
      </p>
      <a
        href="/register"
        className="mt-6 inline-block rounded-full bg-white px-8 py-4 text-base font-bold text-teal transition hover:bg-blue hover:text-white"
      >
        Register now &rarr;
      </a>
    </section>
  );
}
