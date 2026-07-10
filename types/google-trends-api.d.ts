declare module "google-trends-api" {
  const googleTrends: {
    realTimeTrends: (options: { geo: string; category: string }) => Promise<string>;
    interestOverTime: (options: Record<string, string>) => Promise<string>;
  };
  export default googleTrends;
}
