package si.um.feri.TIDS_Project.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import si.um.feri.TIDS_Project.dto.MovieListResponse;
import si.um.feri.TIDS_Project.service.MovieLLMService;

@RestController
@RequestMapping("/api/movies")
@RequiredArgsConstructor
public class MovieController {
    private final MovieLLMService geminiService;

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
}
