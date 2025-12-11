package si.um.feri.TIDS_Project.service;

import com.google.gson.Gson;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import si.um.feri.TIDS_Project.dto.MovieListResponse;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@Slf4j
@Service
public class NamedPipeService {
    private static final String PIPE_NAME = "\\\\.\\pipe\\tids_movie_worker";
    private static final int TIMEOUT_MS = 10000;
    private static final int MAX_RETRIES = 3;
    private final Gson gson = new Gson();

    public MovieListResponse searchMoviesViaPipe(int amount, String genre, int range) {
        Map<String, Object> request = Map.of(
                "action", "search",
                "amount", amount,
                "genre", genre,
                "range", range
        );
        String response = sendToPipe(gson.toJson(request));

        if (response == null) {
            throw new RuntimeException("Worker unavailable");
        }
        return gson.fromJson(response, MovieListResponse.class);
    }

    public boolean checkWorkerHealth() {
        String response = sendToPipe(gson.toJson(Map.of("action", "health")));
        if (response == null) return false;

        try {
            @SuppressWarnings("unchecked")
            Map<String, String> map = gson.fromJson(response, Map.class);
            return "ok".equals(map.get("status"));
        } catch (Exception e) {
            return false;
        }
    }

    private String sendToPipe(String message) {
        for (int attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                return communicate(message);
            } catch (Exception e) {
                if (attempt == MAX_RETRIES) {
                    log.error("Failed after {} attempts", MAX_RETRIES);
                }
                sleep(1000);
            }
        }
        return null;
    }

    private String communicate(String message) throws IOException {
        try (RandomAccessFile pipe = new RandomAccessFile(PIPE_NAME, "rw")) {
            // WRITE REQUEST
            pipe.write(message.getBytes(StandardCharsets.UTF_8));
            pipe.write('\n');

            // READ REPLY
            int length = Integer.parseInt(readUntil(pipe, '\n').trim());
            byte[] data = new byte[length];
            pipe.readFully(data);

            return new String(data, StandardCharsets.UTF_8);
        }
    }

    private String readUntil(RandomAccessFile pipe, char delimiter) throws IOException {
        StringBuilder sb = new StringBuilder();
        long start = System.currentTimeMillis();
        int ch;

        while ((ch = pipe.read()) != -1) {
            if (System.currentTimeMillis() - start > TIMEOUT_MS) {
                throw new IOException("Timeout");
            }
            if (ch == delimiter) break;
            sb.append((char) ch);
        }
        return sb.toString();
    }

    private void sleep(long ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}