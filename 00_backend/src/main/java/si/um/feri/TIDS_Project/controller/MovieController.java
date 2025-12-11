package si.um.feri.TIDS_Project.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import si.um.feri.TIDS_Project.dto.MovieListResponse;
import si.um.feri.TIDS_Project.service.MovieLLMService;
import si.um.feri.TIDS_Project.service.NamedPipeService;

import java.util.Map;

@RestController
@RequestMapping("/api/movies")
@RequiredArgsConstructor
public class MovieController {
    private final MovieLLMService geminiService;
    private final NamedPipeService namedPipeService;

    @GetMapping("/search")
    public ResponseEntity<?> searchMovies(
            @RequestParam(required = false, defaultValue = "5") int amount,
            @RequestParam(required = false, defaultValue = "") String genre,
            @RequestParam(required = false, defaultValue = "6") int range) {

        if (amount < 1 || amount > 20) {
            return ResponseEntity.badRequest().body("Amount must be between 1 and 20 movies");
        }

        if (range < 1 || range > 12) {
            return ResponseEntity.badRequest().body("Range must be between 1 and 12 months");
        }
        String response = geminiService.searchMovies(amount, genre, range);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/structure")
    public ResponseEntity<?> structureMovieData(@RequestBody String unstructuredData) {
        if (unstructuredData == null || unstructuredData.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Unstructured data cannot be empty");
        }
        MovieListResponse response = geminiService.structureData(unstructuredData);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/search-pipe")
    public ResponseEntity<?> searchMoviesViaPipe(
            @RequestParam(required = false, defaultValue = "5") int amount,
            @RequestParam(required = false, defaultValue = "") String genre,
            @RequestParam(required = false, defaultValue = "6") int range) {

        if (amount < 1 || amount > 20) {
            return ResponseEntity.badRequest().body("Amount must be between 1 and 20 movies");
        }

        if (range < 1 || range > 12) {
            return ResponseEntity.badRequest().body("Range must be between 1 and 12 months");
        }

        try {
            MovieListResponse response = namedPipeService.searchMoviesViaPipe(amount, genre, range);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(503).body("Worker unavailable: " + e.getMessage());
        }
    }

    @GetMapping("/health-pipe")
    public ResponseEntity<?> checkWorkerHealth() {
        boolean healthy = namedPipeService.checkWorkerHealth();
        if (healthy) {
            return ResponseEntity.ok(Map.of("status", "ok", "worker", "available"));
        } else {
            return ResponseEntity.status(503).body(Map.of("status", "error", "worker", "unavailable"));
        }
    }
}
