from __future__ import annotations

import logging
import os
import time

from app.services.alerts_v1 import generate_notifications_now, worker_tick


logger = logging.getLogger("innovaplus-worker")


def main() -> int:
    logging.basicConfig(level=os.environ.get("WORKER_LOG_LEVEL", "INFO"))
    tick_s = float(os.environ.get("WORKER_TICK_S", "3"))
    gen_every_s = float(os.environ.get("WORKER_GENERATE_EVERY_S", "60"))
    batch = int(os.environ.get("WORKER_BATCH", "50"))

    last_gen = 0.0
    logger.info("worker started tick_s=%s gen_every_s=%s batch=%s", tick_s, gen_every_s, batch)

    while True:
        now = time.time()
        if now - last_gen >= gen_every_s:
            try:
                stats = generate_notifications_now()
                logger.info("generate ok %s", stats)
            except Exception:
                logger.exception("generate failed")
            last_gen = now

        try:
            stats = worker_tick(batch=batch)
            if stats.get("processed"):
                logger.info("tick %s", stats)
        except Exception:
            logger.exception("tick failed")

        time.sleep(tick_s)


if __name__ == "__main__":
    raise SystemExit(main())

