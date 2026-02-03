// File: word_to_pdf_service.dart
// Service để chuyển đổi Word sang PDF sử dụng API backend

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'dart:io';

class WordToPdfService {
  final Dio _dio;
  final String baseUrl;

  WordToPdfService({
    required this.baseUrl,
    String? token,
  }) : _dio = Dio(
          BaseOptions(
            baseUrl: baseUrl,
            headers: token != null
                ? {'Authorization': 'Bearer $token'}
                : {},
            connectTimeout: const Duration(minutes: 2),
            receiveTimeout: const Duration(minutes: 2),
          ),
        );

  /// Chuyển đổi file Word sang PDF
  /// 
  /// [wordFile] - File Word cần chuyển đổi
  /// [usePublicEndpoint] - Sử dụng endpoint public (không cần auth)
  /// [onProgress] - Callback để theo dõi tiến trình upload
  /// 
  /// Returns: File path của PDF đã chuyển đổi
  Future<String?> convertWordToPdf({
    required File wordFile,
    bool usePublicEndpoint = true,
    Function(int sent, int total)? onProgress,
  }) async {
    try {
      // Validate file
      if (!wordFile.existsSync()) {
        throw Exception('File không tồn tại');
      }

      final fileName = wordFile.path.split('/').last;
      final fileExtension = fileName.split('.').last.toLowerCase();
      
      if (fileExtension != 'doc' && fileExtension != 'docx') {
        throw Exception('Chỉ hỗ trợ file .doc và .docx');
      }

      // Tạo FormData
      FormData formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(
          wordFile.path,
          filename: fileName,
        ),
      });

      // Chọn endpoint
      final endpoint = usePublicEndpoint
          ? '/converter/word-to-pdf-public'
          : '/converter/word-to-pdf';

      if (kDebugMode) {
        print('Converting file: $fileName');
        print('File size: ${wordFile.lengthSync()} bytes');
        print('Using endpoint: $endpoint');
      }

      // Gọi API
      final response = await _dio.post(
        endpoint,
        data: formData,
        options: Options(
          responseType: ResponseType.bytes,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        ),
        onSendProgress: (sent, total) {
          if (onProgress != null) {
            onProgress(sent, total);
          }
          if (kDebugMode) {
            print('Upload progress: ${(sent / total * 100).toStringAsFixed(2)}%');
          }
        },
      );

      // Lưu file PDF
      final pdfFileName = fileName.replaceAll(RegExp(r'\.(docx?|DOCX?)$'), '.pdf');
      final directory = Directory.systemTemp;
      final pdfPath = '${directory.path}/$pdfFileName';
      final pdfFile = File(pdfPath);
      
      await pdfFile.writeAsBytes(response.data);

      if (kDebugMode) {
        print('PDF saved successfully at: $pdfPath');
        print('PDF size: ${pdfFile.lengthSync()} bytes');
      }

      return pdfPath;
    } on DioException catch (e) {
      if (kDebugMode) {
        print('DioError: ${e.message}');
        print('Response: ${e.response?.data}');
      }
      
      if (e.response?.statusCode == 400) {
        throw Exception('Lỗi: ${e.response?.data['message'] ?? 'File không hợp lệ'}');
      } else if (e.response?.statusCode == 401) {
        throw Exception('Lỗi: Không có quyền truy cập');
      } else if (e.response?.statusCode == 413) {
        throw Exception('Lỗi: File quá lớn (tối đa 50MB)');
      } else {
        throw Exception('Lỗi kết nối: ${e.message}');
      }
    } catch (e) {
      if (kDebugMode) {
        print('Error: $e');
      }
      throw Exception('Lỗi không xác định: $e');
    }
  }

  /// Chuyển đổi nhiều file Word sang PDF
  Future<List<String>> convertMultipleFiles({
    required List<File> wordFiles,
    bool usePublicEndpoint = true,
    Function(int current, int total)? onFileProgress,
    Function(int sent, int total)? onUploadProgress,
  }) async {
    List<String> pdfPaths = [];
    
    for (int i = 0; i < wordFiles.length; i++) {
      if (onFileProgress != null) {
        onFileProgress(i + 1, wordFiles.length);
      }

      final pdfPath = await convertWordToPdf(
        wordFile: wordFiles[i],
        usePublicEndpoint: usePublicEndpoint,
        onProgress: onUploadProgress,
      );

      if (pdfPath != null) {
        pdfPaths.add(pdfPath);
      }
    }

    return pdfPaths;
  }
}

// ============================================
// EXAMPLE USAGE IN FLUTTER WIDGET
// ============================================

/*
import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import 'package:open_file/open_file.dart';

class WordToPdfConverterScreen extends StatefulWidget {
  const WordToPdfConverterScreen({Key? key}) : super(key: key);

  @override
  State<WordToPdfConverterScreen> createState() => _WordToPdfConverterScreenState();
}

class _WordToPdfConverterScreenState extends State<WordToPdfConverterScreen> {
  final WordToPdfService _service = WordToPdfService(
    baseUrl: 'https://your-api-server.com', // Thay đổi URL của bạn
    // token: 'YOUR_JWT_TOKEN', // Nếu cần authentication
  );

  bool _isConverting = false;
  double _uploadProgress = 0;
  String? _resultMessage;
  String? _pdfPath;

  Future<void> _pickAndConvertFile() async {
    try {
      // Chọn file
      FilePickerResult? result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['doc', 'docx'],
      );

      if (result != null && result.files.single.path != null) {
        setState(() {
          _isConverting = true;
          _uploadProgress = 0;
          _resultMessage = null;
          _pdfPath = null;
        });

        File wordFile = File(result.files.single.path!);

        // Chuyển đổi
        final pdfPath = await _service.convertWordToPdf(
          wordFile: wordFile,
          usePublicEndpoint: true,
          onProgress: (sent, total) {
            setState(() {
              _uploadProgress = sent / total;
            });
          },
        );

        setState(() {
          _isConverting = false;
          _pdfPath = pdfPath;
          _resultMessage = 'Chuyển đổi thành công!';
        });

        // Hiển thị dialog thành công
        if (mounted) {
          _showSuccessDialog(pdfPath);
        }
      }
    } catch (e) {
      setState(() {
        _isConverting = false;
        _resultMessage = 'Lỗi: ${e.toString()}';
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Lỗi: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  void _showSuccessDialog(String? pdfPath) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Thành công'),
        content: Text('File PDF đã được tạo!\n\nĐường dẫn: $pdfPath'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Đóng'),
          ),
          if (pdfPath != null)
            ElevatedButton(
              onPressed: () {
                OpenFile.open(pdfPath);
                Navigator.pop(context);
              },
              child: const Text('Mở file'),
            ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Word to PDF Converter'),
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.picture_as_pdf,
                size: 100,
                color: Theme.of(context).primaryColor,
              ),
              const SizedBox(height: 32),
              const Text(
                'Chuyển đổi file Word sang PDF',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              const Text(
                'Hỗ trợ định dạng .doc và .docx',
                style: TextStyle(
                  fontSize: 16,
                  color: Colors.grey,
                ),
              ),
              const SizedBox(height: 48),
              
              if (_isConverting) ...[
                CircularProgressIndicator(
                  value: _uploadProgress,
                ),
                const SizedBox(height: 16),
                Text(
                  'Đang xử lý... ${(_uploadProgress * 100).toStringAsFixed(0)}%',
                  style: const TextStyle(fontSize: 16),
                ),
              ] else ...[
                ElevatedButton.icon(
                  onPressed: _pickAndConvertFile,
                  icon: const Icon(Icons.file_upload),
                  label: const Text('Chọn file Word'),
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 32,
                      vertical: 16,
                    ),
                    textStyle: const TextStyle(fontSize: 18),
                  ),
                ),
              ],
              
              if (_resultMessage != null) ...[
                const SizedBox(height: 24),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: _resultMessage!.contains('Lỗi')
                        ? Colors.red.shade50
                        : Colors.green.shade50,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        _resultMessage!.contains('Lỗi')
                            ? Icons.error_outline
                            : Icons.check_circle_outline,
                        color: _resultMessage!.contains('Lỗi')
                            ? Colors.red
                            : Colors.green,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          _resultMessage!,
                          style: TextStyle(
                            color: _resultMessage!.contains('Lỗi')
                                ? Colors.red.shade900
                                : Colors.green.shade900,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
              
              if (_pdfPath != null) ...[
                const SizedBox(height: 16),
                ElevatedButton.icon(
                  onPressed: () => OpenFile.open(_pdfPath),
                  icon: const Icon(Icons.open_in_new),
                  label: const Text('Mở file PDF'),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
*/
