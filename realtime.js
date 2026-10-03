(() => {
  window.shardnoteLive = (sb, specs, handler) => {
    const channelName = "shardnote-live-" + (crypto.randomUUID ? crypto.randomUUID() : Date.now());
    const channel = sb.channel(channelName);
    for (const spec of specs || []) {
      channel.on(
        "postgres_changes",
        {
          event: spec.event || "*",
          schema: "public",
          table: spec.table,
          ...(spec.filter ? { filter: spec.filter } : {})
        },
        payload => {
          try { handler(payload); } catch (e) { console.error("SHARDNOTE realtime handler failed", e); }
        }
      );
    }
    channel.subscribe(status => {
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        console.error("SHARDNOTE realtime connection:", status);
      }
    });
    return channel;
  };
})();