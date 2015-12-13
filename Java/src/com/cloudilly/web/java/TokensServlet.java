package com.cloudilly.web.java;

import com.auth0.jwt.JWTSigner;
import java.util.HashMap;
import java.io.IOException;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

@WebServlet("/tokens")
public class TokensServlet extends HttpServlet {
	private static final long serialVersionUID= 1L;
	
	public TokensServlet() {
		super();
	}

	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		String SECRET= "61ee63b4-2195-4fd9-993a-d8329ccb08ef";
		String device= request.getParameter("device");
		JWTSigner jwtSign= new JWTSigner(SECRET);
		JWTSigner.Options opt= new JWTSigner.Options();
		opt.setExpirySeconds(86400);
		HashMap<String, Object> map= new HashMap<String, Object>();
		map.put("device", device);
		String res= jwtSign.sign(map, opt);   
		response.getWriter().write(res);
	}
}